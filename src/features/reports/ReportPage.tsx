import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Calendar, IndianRupee, UtensilsCrossed, User, Sun, Moon, Users, Calculator } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface MenuPrices {
  chapati_lunch: number
  rice_lunch: number
  chapati_dinner: number
  rice_dinner: number
}

interface ReportData {
  customer: {
    full_name: string
    mobile_number: string
    whatsapp_number: string
    meal_type: string
    lunch_meal_type: string
    dinner_meal_type: string
  }
  vendor: {
    business_name: string
    mobile_number: string
  }
  subscription: {
    start_date: string
    end_date: string
    meal_frequency: string
    plan_amount: number
  } | null
  attendance: {
    daysPresent: number
    lunchCount: number
    dinnerCount: number
    totalMeals: number
    guestCount: number
  }
  payments: {
    total_paid: number
    history: Array<{
      amount: number
      payment_date: string
      payment_mode: string
    }>
  }
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [billingType, setBillingType] = useState<'monthly' | 'per_meal'>('monthly')
  const [menuPrices, setMenuPrices] = useState<MenuPrices>({
    chapati_lunch: 50,
    rice_lunch: 70,
    chapati_dinner: 50,
    rice_dinner: 70
  })

  useEffect(() => {
    if (id) fetchReportData()
  }, [id])

  const fetchReportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch vendor
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, business_name, mobile_number')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return

      // Fetch menu prices
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('name, price')
        .eq('vendor_id', vendor.id)

      if (menuData) {
        const chapatiItem = menuData.find(m => m.name.toLowerCase().includes('chapati'))
        const riceItem = menuData.find(m => m.name.toLowerCase().includes('rice'))
        setMenuPrices({
          chapati_lunch: chapatiItem?.price || 50,
          rice_lunch: riceItem?.price || 70,
          chapati_dinner: chapatiItem?.price || 50,
          rice_dinner: riceItem?.price || 70
        })
      }

      // Fetch customer
      const { data: customer } = await supabase
        .from('customers')
        .select('full_name, mobile_number, whatsapp_number, meal_type, lunch_meal_type, dinner_meal_type')
        .eq('id', id)
        .single()

      // Fetch subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('start_date, end_date, meal_frequency, plan_amount')
        .eq('customer_id', id)
        .eq('status', 'active')
        .single()

      // Fetch attendance stats
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('attendance_date, lunch_taken, dinner_taken, guest_count')
        .eq('customer_id', id)

      // Calculate attendance metrics
      const daysPresent = new Set(
        attendanceData?.filter(a => a.lunch_taken || a.dinner_taken).map(a => a.attendance_date)
      ).size
      const lunchCount = attendanceData?.filter(a => a.lunch_taken).length || 0
      const dinnerCount = attendanceData?.filter(a => a.dinner_taken).length || 0
      const totalMeals = lunchCount + dinnerCount
      const guestCount = attendanceData?.reduce((sum, a) => sum + (a.guest_count || 0), 0) || 0

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_mode')
        .eq('customer_id', id)
        .order('payment_date', { ascending: false })

      const totalPaid = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      setReport({
        customer: customer!,
        vendor: { business_name: vendor.business_name, mobile_number: vendor.mobile_number },
        subscription,
        attendance: { 
          daysPresent, 
          lunchCount, 
          dinnerCount, 
          totalMeals, 
          guestCount
        },
        payments: {
          total_paid: totalPaid,
          history: paymentsData || []
        }
      })

    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate amounts based on billing type
const calculateBill = () => {
  if (!report) return { mealCharges: 0, guestCharges: 0, totalDue: 0, pending: 0, lunchPrice: 0, dinnerPrice: 0, avgMealPrice: 0 }

  let mealCharges = 0
  let guestCharges = 0

  const lunchType = report.customer.lunch_meal_type || 'chapati_bhaji'
  const dinnerType = report.customer.dinner_meal_type || 'chapati_bhaji'
  
  const lunchPrice = lunchType === 'rice_plate' ? menuPrices.rice_lunch : menuPrices.chapati_lunch
  const dinnerPrice = dinnerType === 'rice_plate' ? menuPrices.rice_dinner : menuPrices.chapati_dinner

  if (billingType === 'monthly') {
    mealCharges = report.subscription?.plan_amount || 0
  } else {
    mealCharges = (report.attendance.lunchCount * lunchPrice) + (report.attendance.dinnerCount * dinnerPrice)
  }

  const avgMealPrice = Math.round((lunchPrice + dinnerPrice) / 2)
  guestCharges = report.attendance.guestCount * avgMealPrice

  const totalDue = mealCharges + guestCharges
  
  // Pending can be negative (means refund/carry forward)
  const pending = totalDue - report.payments.total_paid

  return { mealCharges, guestCharges, totalDue, pending, lunchPrice, dinnerPrice, avgMealPrice }
}

  const billDetails = calculateBill()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getMealTypeLabel = (type: string) => {
    return type === 'chapati_bhaji' ? 'Chapati Bhaji' : type === 'rice_plate' ? 'Rice Plate' : 'Both'
  }

const generateWhatsAppMessage = () => {
  if (!report) return ''

  const bill = calculateBill()
  
  let balanceText = ''
  if (bill.pending > 0) {
    balanceText = `⚠️ *PENDING: ₹${bill.pending.toLocaleString()}*\n(कृपया बाकी रक्कम भरा)`
  } else if (bill.pending < 0) {
    balanceText = `💰 *REFUND/CARRY FORWARD: ₹${Math.abs(bill.pending).toLocaleString()}*\n(पुढच्या महिन्यात adjust होईल)`
  } else {
    balanceText = `✅ *FULLY PAID* 🎉`
  }

  const msg = `
━━━━━━━━━━━━━━━━━━━━━
*${report.vendor.business_name}*
━━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${report.customer.full_name}
📱 *Mobile:* ${report.customer.mobile_number}
${report.subscription ? `📅 *Period:* ${formatDate(report.subscription.start_date)} - ${formatDate(report.subscription.end_date)}` : ''}

*🍽️ MEAL SUMMARY*
────────────────────
📆 Days Present: *${report.attendance.daysPresent} days*
🌅 Lunch: *${report.attendance.lunchCount} meals*
🌙 Dinner: *${report.attendance.dinnerCount} meals*
🍱 Total: *${report.attendance.totalMeals} meals*
${report.attendance.guestCount > 0 ? `👥 Guests: *${report.attendance.guestCount} meals*` : ''}

*💰 BILL DETAILS (${billingType === 'monthly' ? 'Monthly' : 'Per Meal'})*
────────────────────
${billingType === 'per_meal' 
  ? `🌅 Lunch: ${report.attendance.lunchCount} × ₹${bill.lunchPrice} = ₹${(report.attendance.lunchCount * bill.lunchPrice).toLocaleString()}
🌙 Dinner: ${report.attendance.dinnerCount} × ₹${bill.dinnerPrice} = ₹${(report.attendance.dinnerCount * bill.dinnerPrice).toLocaleString()}
📊 Meal Total: ₹${bill.mealCharges.toLocaleString()}`
  : `📅 Plan Amount: ₹${bill.mealCharges.toLocaleString()}`}
${bill.guestCharges > 0 ? `👥 Guest: ${report.attendance.guestCount} × ₹${bill.avgMealPrice} = ₹${bill.guestCharges.toLocaleString()}` : ''}

📋 *Total Bill: ₹${bill.totalDue.toLocaleString()}*
✅ Paid: ₹${report.payments.total_paid.toLocaleString()}
────────────────────
${balanceText}

━━━━━━━━━━━━━━━━━━━━━
Thank you! 🙏
📞 ${report.vendor.mobile_number}
  `.trim()

  return encodeURIComponent(msg)
}

  const handleWhatsAppShare = () => {
    const phone = report?.customer.whatsapp_number || report?.customer.mobile_number
    const message = generateWhatsAppMessage()
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Report not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Customer Report</h1>
            <p className="text-sm text-gray-500">{report.customer.full_name}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">

        {/* Billing Type Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Billing Type</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setBillingType('monthly')}
              className={`p-4 rounded-xl border-2 text-center transition ${
                billingType === 'monthly' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">📅</div>
              <div className="font-semibold text-gray-900">Monthly</div>
              <div className="text-xs text-gray-500">Fixed ₹{report.subscription?.plan_amount || 0}</div>
            </button>
            <button
              onClick={() => setBillingType('per_meal')}
              className={`p-4 rounded-xl border-2 text-center transition ${
                billingType === 'per_meal' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🍽️</div>
              <div className="font-semibold text-gray-900">Per Meal</div>
              <div className="text-xs text-gray-500">₹{menuPrices.chapati_lunch}-{menuPrices.rice_lunch}/meal</div>
            </button>
          </div>
        </div>

        {/* Business Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white text-center">
          <h2 className="text-xl font-bold">{report.vendor.business_name}</h2>
          <p className="text-orange-100 text-sm mt-1">
            {billingType === 'monthly' ? 'Monthly Statement' : 'Per Meal Statement'}
          </p>
          {report.subscription && (
            <p className="text-white/80 text-xs mt-2">
              {formatDate(report.subscription.start_date)} - {formatDate(report.subscription.end_date)}
            </p>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{report.customer.full_name}</h3>
              <p className="text-sm text-gray-500">{report.customer.mobile_number}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              report.customer.meal_type === 'veg' 
                ? 'bg-green-100 text-green-700' 
                : report.customer.meal_type === 'non_veg'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-purple-100 text-purple-700'
            }`}>
              {report.customer.meal_type === 'veg' ? '🥬 Veg' : report.customer.meal_type === 'non_veg' ? '🍗 Non-Veg' : '🍱 Both'}
            </span>
          </div>
          
          {/* Meal Preferences */}
          {report.subscription?.meal_frequency && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Meal Preferences</p>
              <div className="flex gap-3">
                {report.customer.lunch_meal_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sun className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">Lunch: {getMealTypeLabel(report.customer.lunch_meal_type)}</span>
                  </div>
                )}
                {report.subscription.meal_frequency === 'two_times' && report.customer.dinner_meal_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Moon className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-600">Dinner: {getMealTypeLabel(report.customer.dinner_meal_type)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Meal Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-500" />
              Meal Summary
            </h3>
          </div>
          <div className="p-4">
            {/* Days Present */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-600">Days Present</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{report.attendance.daysPresent}</span>
            </div>

            {/* Lunch Count */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Sun className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <span className="text-gray-600">Lunch</span>
                  {billingType === 'per_meal' && (
                    <p className="text-xs text-gray-400">₹{billDetails.lunchPrice}/meal</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-orange-600">{report.attendance.lunchCount}</span>
                {billingType === 'per_meal' && (
                  <p className="text-xs text-gray-400">= ₹{report.attendance.lunchCount * (billDetails.lunchPrice || 0)}</p>
                )}
              </div>
            </div>

            {/* Dinner Count */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-gray-600">Dinner</span>
                  {billingType === 'per_meal' && (
                    <p className="text-xs text-gray-400">₹{billDetails.dinnerPrice}/meal</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-purple-600">{report.attendance.dinnerCount}</span>
                {billingType === 'per_meal' && (
                  <p className="text-xs text-gray-400">= ₹{report.attendance.dinnerCount * (billDetails.dinnerPrice || 0)}</p>
                )}
              </div>
            </div>

            {/* Total Meals */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-600 font-medium">Total Meals</span>
              </div>
              <span className="text-xl font-bold text-green-600">{report.attendance.totalMeals}</span>
            </div>

            {/* Guest Meals */}
            {report.attendance.guestCount > 0 && (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-gray-600">Guest Meals</span>
                    <p className="text-xs text-gray-400">₹{billDetails.avgMealPrice}/meal</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-amber-600">{report.attendance.guestCount}</span>
                  <p className="text-xs text-gray-400">= ₹{billDetails.guestCharges}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Bill */}
<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
  <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
      <IndianRupee className="w-4 h-4 text-green-500" />
      Bill Summary ({billingType === 'monthly' ? 'Monthly Fixed' : 'Per Meal Basis'})
    </h3>
  </div>
  <div className="p-4 space-y-3">
    
    {/* Meal Charges Breakdown */}
    {billingType === 'per_meal' ? (
      <>
        <div className="bg-orange-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-orange-600 uppercase">Meal Charges</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">🌅 Lunch ({report.attendance.lunchCount} × ₹{billDetails.lunchPrice})</span>
            <span className="font-medium">₹{(report.attendance.lunchCount * (billDetails.lunchPrice || 0)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">🌙 Dinner ({report.attendance.dinnerCount} × ₹{billDetails.dinnerPrice})</span>
            <span className="font-medium">₹{(report.attendance.dinnerCount * (billDetails.dinnerPrice || 0)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
            <span className="font-medium text-gray-700">Meal Total</span>
            <span className="font-bold text-orange-600">₹{billDetails.mealCharges.toLocaleString()}</span>
          </div>
        </div>
      </>
    ) : (
      <div className="flex justify-between">
        <span className="text-gray-600">📅 Monthly Plan</span>
        <span className="font-medium">₹{billDetails.mealCharges.toLocaleString()}</span>
      </div>
    )}

    {/* Guest Charges */}
    {billDetails.guestCharges > 0 && (
      <div className="flex justify-between">
        <span className="text-gray-600">👥 Guest ({report.attendance.guestCount} × ₹{billDetails.avgMealPrice})</span>
        <span className="font-medium">+ ₹{billDetails.guestCharges.toLocaleString()}</span>
      </div>
    )}
    
    {/* Total Bill */}
    <div className="flex justify-between py-2 border-t border-dashed border-gray-200">
      <span className="font-semibold text-gray-800">📋 Total Bill</span>
      <span className="font-bold text-lg">₹{billDetails.totalDue.toLocaleString()}</span>
    </div>

    {/* Amount Paid */}
    <div className="flex justify-between">
      <span className="text-gray-600">✅ Amount Paid</span>
      <span className="font-medium text-green-600">₹{report.payments.total_paid.toLocaleString()}</span>
    </div>
    
    {/* Final Balance */}
    <div className={`p-4 rounded-xl ${
      billDetails.pending > 0 
        ? 'bg-red-50 border border-red-200' 
        : billDetails.pending < 0 
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-green-50 border border-green-200'
    }`}>
      <div className="flex justify-between items-center">
        <div>
          <span className={`font-bold text-lg ${
            billDetails.pending > 0 
              ? 'text-red-600' 
              : billDetails.pending < 0 
                ? 'text-blue-600'
                : 'text-green-600'
          }`}>
            {billDetails.pending > 0 
              ? '⚠️ PENDING' 
              : billDetails.pending < 0 
                ? '💰 REFUND/CARRY FORWARD'
                : '✅ FULLY PAID'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {billDetails.pending > 0 
              ? 'Amount to collect from customer' 
              : billDetails.pending < 0 
                ? 'Return to customer or adjust next month'
                : 'No balance due'}
          </p>
        </div>
        <span className={`font-bold text-2xl ${
          billDetails.pending > 0 
            ? 'text-red-600' 
            : billDetails.pending < 0 
              ? 'text-blue-600'
              : 'text-green-600'
        }`}>
          {billDetails.pending === 0 
            ? '✓' 
            : `₹${Math.abs(billDetails.pending).toLocaleString()}`}
        </span>
      </div>
    </div>

  </div>
</div>

        {/* Payment History */}
        {report.payments.history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Payment History</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {report.payments.history.map((payment, index) => (
                <div key={index} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">₹{Number(payment.amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(payment.payment_date)} • {payment.payment_mode?.toUpperCase()}
                    </p>
                  </div>
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-lg shadow-green-200"
          >
            <MessageCircle className="w-5 h-5" />
            Share Report on WhatsApp
          </button>
        </div>

      </div>
    </div>
  )
}