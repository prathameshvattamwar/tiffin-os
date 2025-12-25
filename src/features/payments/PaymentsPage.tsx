import { useState, useEffect } from 'react'
import { IndianRupee, Plus, Search, Calendar, TrendingUp, TrendingDown, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import RecordPaymentModal from './RecordPaymentModal'

interface CustomerWithPending {
  id: string
  full_name: string
  mobile_number: string
  whatsapp_number?: string
  subscription?: {
    id: string
    plan_amount: number
  }
  total_paid: number
  pending_amount: number
  guest_charges: number
}

interface PaymentRecord {
  id: string
  amount: number
  payment_type: string
  payment_mode: string
  payment_date: string
  customer: {
    full_name: string
  }
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [customers, setCustomers] = useState<CustomerWithPending[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithPending | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendorName, setVendorName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, business_name')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return
      setVendorId(vendor.id)
      setVendorName(vendor.business_name)

      // Fetch customers with active subscriptions
      const { data: customersData } = await supabase
        .from('customers')
        .select(`
          id,
          full_name,
          mobile_number,
          whatsapp_number,
          subscriptions!inner (
            id,
            plan_amount,
            status
          )
        `)
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .eq('subscriptions.status', 'active')

      // Fetch all payments for this vendor
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          id,
          customer_id,
          amount,
          payment_type,
          payment_mode,
          payment_date,
          customers (
            full_name
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('payment_date', { ascending: false })
        .limit(50)

      // Fetch attendance for guest charges
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('customer_id, guest_count')
        .eq('vendor_id', vendor.id)

      // Calculate pending for each customer
      const customersWithPending: CustomerWithPending[] = (customersData || []).map((c: any) => {
        const customerPayments = (paymentsData || []).filter((p: any) => p.customer_id === c.id)
        const totalPaid = customerPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
        const planAmount = c.subscriptions?.[0]?.plan_amount || 0
        
        // Guest charges (₹40 per guest)
        const customerAttendance = attendanceData?.filter(a => a.customer_id === c.id) || []
        const totalGuests = customerAttendance.reduce((sum, a) => sum + (a.guest_count || 0), 0)
        const guestCharges = totalGuests * 40
        
        return {
          id: c.id,
          full_name: c.full_name,
          mobile_number: c.mobile_number,
          whatsapp_number: c.whatsapp_number,
          subscription: c.subscriptions?.[0],
          total_paid: totalPaid,
          pending_amount: Math.max(0, planAmount + guestCharges - totalPaid),
          guest_charges: guestCharges
        }
      })

      setCustomers(customersWithPending.filter(c => c.pending_amount > 0))
      setPayments((paymentsData || []).map((p: any) => ({
        ...p,
        customer: p.customers
      })))

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPending = customers.reduce((sum, c) => sum + c.pending_amount, 0)
  const todayCollection = payments
    .filter(p => p.payment_date === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobile_number.includes(searchQuery)
  )

  const openPaymentModal = (customer: CustomerWithPending) => {
    setSelectedCustomer(customer)
    setShowPaymentModal(true)
  }

  const sendWhatsAppReminder = (customer: CustomerWithPending) => {
    const phone = customer.whatsapp_number || customer.mobile_number
    const message = `
🔔 *Payment Reminder*
━━━━━━━━━━━━━━━━━━

Hi ${customer.full_name},

This is a friendly reminder from *${vendorName}*.

Your pending amount is: *₹${customer.pending_amount.toLocaleString()}*
${customer.guest_charges > 0 ? `(Includes ₹${customer.guest_charges} guest charges)` : ''}

Please clear your dues at your earliest convenience.

Payment Options:
- Cash
- UPI / Online Transfer

Thank you for your cooperation! 🙏

_${vendorName}_
    `.trim()

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getPaymentModeEmoji = (mode: string) => {
    switch (mode) {
      case 'cash': return '💵'
      case 'upi': return '📱'
      case 'card': return '💳'
      case 'bank_transfer': return '🏦'
      default: return '💰'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 mb-4">Payments</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">Total Pending</span>
            </div>
            <p className="text-xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Today's Collection</span>
            </div>
            <p className="text-xl font-bold text-green-600">₹{todayCollection.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Pending ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        
        {/* Search (for pending tab) */}
        {activeTab === 'pending' && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'pending' ? (
          /* Pending List */
          filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">All Clear! 🎉</h3>
              <p className="text-gray-500">No pending payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-red-600">
                        {customer.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{customer.full_name}</h3>
                      <p className="text-sm text-gray-500">{customer.mobile_number}</p>
                      {customer.guest_charges > 0 && (
                        <p className="text-xs text-blue-500">+₹{customer.guest_charges} guest charges</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">₹{customer.pending_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">pending</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => sendWhatsAppReminder(customer)}
                      className="flex-none w-12 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-200 transition"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openPaymentModal(customer)}
                      className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Record Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Payment History */
          payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No payments yet</h3>
              <p className="text-gray-500">Payment history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                    {getPaymentModeEmoji(payment.payment_mode)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{payment.customer?.full_name}</h3>
                    <p className="text-xs text-gray-500">
                      {formatDate(payment.payment_date)} • {payment.payment_type}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">+₹{Number(payment.amount).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedCustomer && vendorId && (
        <RecordPaymentModal
          customer={selectedCustomer}
          vendorId={vendorId}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedCustomer(null)
          }}
          onSuccess={() => {
            setShowPaymentModal(false)
            setSelectedCustomer(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}