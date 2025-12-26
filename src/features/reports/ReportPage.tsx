import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Calendar, IndianRupee, UtensilsCrossed, User, Sun, Moon, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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
    guestCharges: number
  }
  payments: {
    total_paid: number
    pending: number
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
        .select('business_name, mobile_number')
        .eq('auth_user_id', user.id)
        .single()

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
      const guestCharges = guestCount * 40

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_mode')
        .eq('customer_id', id)
        .order('payment_date', { ascending: false })

      const totalPaid = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const planAmount = subscription?.plan_amount || 0
      const pending = Math.max(0, planAmount + guestCharges - totalPaid)

      setReport({
        customer: customer!,
        vendor: vendor!,
        subscription,
        attendance: { 
          daysPresent, 
          lunchCount, 
          dinnerCount, 
          totalMeals, 
          guestCount,
          guestCharges
        },
        payments: {
          total_paid: totalPaid,
          pending,
          history: paymentsData || []
        }
      })

    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

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
🍱 Total Meals: *${report.attendance.totalMeals} meals*
👥 Guest Meals: *${report.attendance.guestCount} meals*

*💰 PAYMENT DETAILS*
────────────────────
📋 Plan Amount: ₹${report.subscription?.plan_amount?.toLocaleString() || 0}
${report.attendance.guestCharges > 0 ? `👥 Guest Charges: ₹${report.attendance.guestCharges.toLocaleString()}` : ''}
${report.attendance.guestCharges > 0 ? `📊 Total Due: ₹${((report.subscription?.plan_amount || 0) + report.attendance.guestCharges).toLocaleString()}` : ''}
✅ Total Paid: ₹${report.payments.total_paid.toLocaleString()}

${report.payments.pending > 0 ? `⚠️ *PENDING: ₹${report.payments.pending.toLocaleString()}*` : '✅ *FULLY PAID* 🎉'}

━━━━━━━━━━━━━━━━━━━━━
Thank you for choosing us! 🙏
📞 Contact: ${report.vendor.mobile_number}
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

        {/* Business Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white text-center">
          <h2 className="text-xl font-bold">{report.vendor.business_name}</h2>
          <p className="text-orange-100 text-sm mt-1">Monthly Statement</p>
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
                {(report.subscription.meal_frequency === 'two_times' || report.subscription.meal_frequency === 'one_time') && report.customer.lunch_meal_type && (
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

        {/* Meal Summary - Enhanced */}
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
                <span className="text-gray-600">Lunch Taken</span>
              </div>
              <span className="text-xl font-bold text-orange-600">{report.attendance.lunchCount}</span>
            </div>

            {/* Dinner Count */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-600">Dinner Taken</span>
              </div>
              <span className="text-xl font-bold text-purple-600">{report.attendance.dinnerCount}</span>
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
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <span className="text-gray-600">Guest Meals</span>
                  {report.attendance.guestCharges > 0 && (
                    <p className="text-xs text-gray-400">₹40 × {report.attendance.guestCount} = ₹{report.attendance.guestCharges}</p>
                  )}
                </div>
              </div>
              <span className="text-xl font-bold text-amber-600">{report.attendance.guestCount}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-500" />
              Payment Details
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {report.subscription && (
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Amount</span>
                <span className="font-medium">₹{report.subscription.plan_amount.toLocaleString()}</span>
              </div>
            )}
            {report.attendance.guestCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Guest Charges</span>
                <span className="font-medium text-amber-600">+ ₹{report.attendance.guestCharges.toLocaleString()}</span>
              </div>
            )}
            {report.attendance.guestCharges > 0 && (
              <div className="flex justify-between pt-2 border-t border-dashed border-gray-200">
                <span className="text-gray-600 font-medium">Total Due</span>
                <span className="font-bold">₹{((report.subscription?.plan_amount || 0) + report.attendance.guestCharges).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-medium text-green-600">- ₹{report.payments.total_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-gray-200">
              <span className="font-bold text-gray-800">Balance</span>
              <span className={`font-bold text-xl ${report.payments.pending > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {report.payments.pending > 0 ? `₹${report.payments.pending.toLocaleString()}` : '✓ Paid'}
              </span>
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