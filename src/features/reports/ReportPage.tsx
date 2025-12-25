import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Calendar, IndianRupee, UtensilsCrossed, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ReportData {
  customer: {
    full_name: string
    mobile_number: string
    whatsapp_number: string
    meal_type: string
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
    present: number
    absent: number
    guests: number
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
        .select('full_name, mobile_number, whatsapp_number, meal_type')
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
        .select('meal_taken, guest_count')
        .eq('customer_id', id)

      const present = attendanceData?.filter(a => a.meal_taken === 'present').length || 0
      const absent = attendanceData?.filter(a => a.meal_taken === 'absent').length || 0
      const guests = attendanceData?.reduce((sum, a) => sum + (a.guest_count || 0), 0) || 0

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_mode')
        .eq('customer_id', id)
        .order('payment_date', { ascending: false })

      const totalPaid = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const planAmount = subscription?.plan_amount || 0
      const pending = Math.max(0, planAmount - totalPaid)

      setReport({
        customer: customer!,
        vendor: vendor!,
        subscription,
        attendance: { present, absent, guests },
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

  const generateWhatsAppMessage = () => {
    if (!report) return ''

    const msg = `
━━━━━━━━━━━━━━━━━━━━━
*${report.vendor.business_name}*
━━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${report.customer.full_name}
📱 *Mobile:* ${report.customer.mobile_number}
${report.subscription ? `📅 *Period:* ${formatDate(report.subscription.start_date)} - ${formatDate(report.subscription.end_date)}` : ''}

*ATTENDANCE SUMMARY*
────────────────────
✅ Present: ${report.attendance.present} days
❌ Absent: ${report.attendance.absent} days
👥 Guests: ${report.attendance.guests}

*PAYMENT DETAILS*
────────────────────
💰 Plan Amount: ₹${report.subscription?.plan_amount?.toLocaleString() || 0}
✅ Total Paid: ₹${report.payments.total_paid.toLocaleString()}
${report.payments.pending > 0 ? `⚠️ *PENDING: ₹${report.payments.pending.toLocaleString()}*` : '✅ *FULLY PAID*'}

━━━━━━━━━━━━━━━━━━━━━
Thank you for choosing us! 🙏
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
          <p className="text-orange-100 text-sm mt-1">Customer Statement</p>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{report.customer.full_name}</h3>
              <p className="text-sm text-gray-500">{report.customer.mobile_number}</p>
            </div>
          </div>
          {report.subscription && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(report.subscription.start_date)} - {formatDate(report.subscription.end_date)}</span>
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-500" />
              Attendance Summary
            </h3>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{report.attendance.present}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-500">{report.attendance.absent}</p>
              <p className="text-xs text-red-500">Absent</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{report.attendance.guests}</p>
              <p className="text-xs text-blue-600">Guests</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
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
            <div className="flex justify-between">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-medium text-green-600">₹{report.payments.total_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <span className="font-semibold text-gray-800">Pending</span>
              <span className={`font-bold text-lg ${report.payments.pending > 0 ? 'text-red-500' : 'text-green-500'}`}>
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
                    <p className="text-xs text-gray-500">{formatDate(payment.payment_date)} • {payment.payment_mode}</p>
                  </div>
                  <span className="text-green-500 text-sm">✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Share on WhatsApp
          </button>
        </div>

      </div>
    </div>
  )
}