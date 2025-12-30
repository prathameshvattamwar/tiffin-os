import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomerReport } from '../../hooks/useQueries'
import { ArrowLeft, MessageCircle, Calendar, IndianRupee, UtensilsCrossed, User, Sun, Moon, Users, Calculator } from 'lucide-react'

interface MenuPrices {
  half_thali: number
  full_thali: number
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
    guestLunchCount: number
    guestDinnerCount: number
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
  const { data: reportData, isLoading: loading } = useCustomerReport(id)
  const [billingType, setBillingType] = useState<'monthly' | 'per_meal'>('monthly')

  const report = reportData ? {
    customer: reportData.customer,
    vendor: reportData.vendor,
    subscription: reportData.subscription,
    attendance: reportData.attendance,
    payments: reportData.payments
  } : null
  
  const menuPrices = reportData?.menuPrices || { half_thali: 50, full_thali: 70 }

const calculateBill = () => {
  if (!report) return { mealCharges: 0, guestCharges: 0, guestLunchCharges: 0, guestDinnerCharges: 0, totalDue: 0, pending: 0, lunchPrice: 0, dinnerPrice: 0 }

  let mealCharges = 0

  const lunchType = report.customer.lunch_meal_type || 'half_thali'
  const dinnerType = report.customer.dinner_meal_type || 'half_thali'

  const lunchPrice = lunchType === 'full_thali' ? menuPrices.full_thali : menuPrices.half_thali
  const dinnerPrice = dinnerType === 'full_thali' ? menuPrices.full_thali : menuPrices.half_thali

  if (billingType === 'monthly') {
    mealCharges = report.subscription?.plan_amount || 0
  } else {
    mealCharges = (report.attendance.lunchCount * lunchPrice) + (report.attendance.dinnerCount * dinnerPrice)
  }

  // Guest charges - separate for lunch and dinner
  const guestLunchCharges = report.attendance.guestLunchCount * lunchPrice
  const guestDinnerCharges = report.attendance.guestDinnerCount * dinnerPrice
  const guestCharges = guestLunchCharges + guestDinnerCharges

  const totalDue = mealCharges + guestCharges
  
  // Pending can be negative (means refund/carry forward)
  const pending = totalDue - report.payments.total_paid

  return { mealCharges, guestCharges, guestLunchCharges, guestDinnerCharges, totalDue, pending, lunchPrice, dinnerPrice }
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
  return type === 'half_thali' ? 'Half Thali' : type === 'full_thali' ? 'Full Thali' : 'Half Thali'
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
${report.attendance.guestLunchCount > 0 ? `👥 Guest Lunch: *${report.attendance.guestLunchCount} meals*` : ''}
${report.attendance.guestDinnerCount > 0 ? `👥 Guest Dinner: *${report.attendance.guestDinnerCount} meals*` : ''}

*💰 BILL DETAILS (${billingType === 'monthly' ? 'Monthly' : 'Per Meal'})*
────────────────────
${billingType === 'per_meal' 
  ? `🌅 Lunch: ${report.attendance.lunchCount} × ₹${bill.lunchPrice} = ₹${(report.attendance.lunchCount * bill.lunchPrice).toLocaleString()}
🌙 Dinner: ${report.attendance.dinnerCount} × ₹${bill.dinnerPrice} = ₹${(report.attendance.dinnerCount * bill.dinnerPrice).toLocaleString()}
📊 Meal Total: ₹${bill.mealCharges.toLocaleString()}`
  : `📅 Plan Amount: ₹${bill.mealCharges.toLocaleString()}`}
${bill.guestLunchCharges > 0 ? `👥 Guest Lunch: ${report.attendance.guestLunchCount} × ₹${bill.lunchPrice} = ₹${bill.guestLunchCharges.toLocaleString()}` : ''}
${bill.guestDinnerCharges > 0 ? `👥 Guest Dinner: ${report.attendance.guestDinnerCount} × ₹${bill.dinnerPrice} = ₹${bill.guestDinnerCharges.toLocaleString()}` : ''}

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
              <div className="text-xs text-gray-500">₹{menuPrices.half_thali}-{menuPrices.full_thali}/meal</div>
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

            {/* Guest Lunch */}
            {report.attendance.guestLunchCount > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🌅</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Guest Lunch</span>
                    <p className="text-xs text-gray-400">₹{billDetails.lunchPrice}/meal</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-orange-600">{report.attendance.guestLunchCount}</span>
                  <p className="text-xs text-gray-400">= ₹{billDetails.guestLunchCharges}</p>
                </div>
              </div>
            )}

            {/* Guest Dinner */}
            {report.attendance.guestDinnerCount > 0 && (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🌙</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Guest Dinner</span>
                    <p className="text-xs text-gray-400">₹{billDetails.dinnerPrice}/meal</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-purple-600">{report.attendance.guestDinnerCount}</span>
                  <p className="text-xs text-gray-400">= ₹{billDetails.guestDinnerCharges}</p>
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

    {/* Guest Lunch Charges */}
    {billDetails.guestLunchCharges > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">🌅 Guest Lunch ({report.attendance.guestLunchCount} × ₹{billDetails.lunchPrice})</span>
        <span className="font-medium">+ ₹{billDetails.guestLunchCharges.toLocaleString()}</span>
      </div>
    )}

    {/* Guest Dinner Charges */}
    {billDetails.guestDinnerCharges > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">🌙 Guest Dinner ({report.attendance.guestDinnerCount} × ₹{billDetails.dinnerPrice})</span>
        <span className="font-medium">+ ₹{billDetails.guestDinnerCharges.toLocaleString()}</span>
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