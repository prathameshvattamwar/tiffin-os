import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MessageCircle, Edit2, Calendar, IndianRupee, UtensilsCrossed, FileText, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'


interface CustomerDetail {
  id: string
  full_name: string
  mobile_number: string
  whatsapp_number: string
  customer_type: string
  meal_type: string
  address: string
  notes: string
  is_active: boolean
  created_at: string
  subscription?: {
    id: string
    start_date: string
    end_date: string
    meal_frequency: string
    plan_amount: number
    status: string
  }
  total_paid: number
  pending_amount: number
  attendance_count: number
}

  // Renew Subscription Component
  function RenewSubscriptionButton({ customer, onSuccess }: { 
    customer: CustomerDetail
    onSuccess: () => void 
  }) {
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    
    const today = new Date()
    const endDate = customer.subscription ? new Date(customer.subscription.end_date) : null
    const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
    const canRenew = daysLeft <= 7 // Can renew if 7 days or less remaining
    
    const [formData, setFormData] = useState({
      start_date: '',
      end_date: '',
      plan_amount: customer.subscription?.plan_amount?.toString() || '',
      advance_amount: '',
      payment_mode: 'cash'
    })

    const openModal = () => {
      // New subscription starts day after current ends
      const newStart = new Date(customer.subscription?.end_date || new Date())
      newStart.setDate(newStart.getDate() + 1)
      
      const newEnd = new Date(newStart)
      newEnd.setMonth(newEnd.getMonth() + 1)

      setFormData({
        start_date: newStart.toISOString().split('T')[0],
        end_date: newEnd.toISOString().split('T')[0],
        plan_amount: customer.subscription?.plan_amount?.toString() || '',
        advance_amount: '',
        payment_mode: 'cash'
      })
      setShowModal(true)
    }

    const handleRenew = async () => {
      if (!formData.plan_amount) {
        alert('Please enter plan amount')
        return
      }

      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!vendor) throw new Error('Vendor not found')

        // 1. Mark old subscription as completed
        if (customer.subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'completed' })
            .eq('id', customer.subscription.id)
        }

        // 2. Create new subscription
        const { data: newSub, error: subError } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: customer.id,
            vendor_id: vendor.id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            meal_frequency: customer.subscription?.meal_frequency || 'one_time',
            plan_amount: Number(formData.plan_amount),
            status: 'active'
          })
          .select()
          .single()

        if (subError) throw subError

        // 3. Record advance payment if any
        if (Number(formData.advance_amount) > 0) {
          await supabase
            .from('payments')
            .insert({
              customer_id: customer.id,
              subscription_id: newSub.id,
              vendor_id: vendor.id,
              amount: Number(formData.advance_amount),
              payment_type: 'advance',
              payment_mode: formData.payment_mode,
              payment_date: formData.start_date,
              status: 'completed'
            })
        }

        setShowModal(false)
        onSuccess()
      } catch (error: any) {
        alert('Error renewing: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    // Calculate totals
    const previousPending = customer.pending_amount
    const newPlanAmount = Number(formData.plan_amount) || 0
    const advancePaid = Number(formData.advance_amount) || 0
    const totalDue = previousPending + newPlanAmount
    const newPending = totalDue - advancePaid

    if (!canRenew) return null

    return (
      <>
        <button
          onClick={openModal}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
            daysLeft <= 0 
              ? 'bg-red-500 text-white' 
              : 'bg-orange-100 text-orange-600 border-2 border-orange-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          {daysLeft <= 0 ? 'Subscription Expired - Renew Now' : `Renew Subscription (${daysLeft}d left)`}
        </button>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowModal(false)}>
            <div className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Renew Subscription</h2>
                <p className="text-sm text-gray-500">{customer.full_name}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Previous Pending */}
                {previousPending > 0 && (
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-red-600 font-medium">Previous Pending</span>
                      <span className="text-lg font-bold text-red-600">₹{previousPending.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-red-500 mt-1">This will be carried forward</p>
                  </div>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Plan Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      value={formData.plan_amount}
                      onChange={e => setFormData({ ...formData, plan_amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Advance Payment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      value={formData.advance_amount}
                      onChange={e => setFormData({ ...formData, advance_amount: e.target.value })}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="grid grid-cols-4 gap-2">
                  {['cash', 'upi', 'card', 'bank_transfer'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_mode: mode })}
                      className={`p-2 rounded-lg border-2 text-center text-xs font-medium capitalize ${
                        formData.payment_mode === mode
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Previous Pending</span>
                    <span>₹{previousPending.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">New Plan Amount</span>
                    <span>₹{newPlanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Advance Paid</span>
                    <span className="text-green-600">- ₹{advancePaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold">New Pending</span>
                    <span className={`font-bold text-lg ${newPending > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{newPending.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRenew}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Renewal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (id) fetchCustomerDetail()
  }, [id])

  const fetchCustomerDetail = async () => {
    try {
      // Fetch customer
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Fetch active subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', id)
        .eq('status', 'active')
        .single()

      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('customer_id', id)

      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const planAmount = subscriptionData?.plan_amount || 0
      const pendingAmount = Math.max(0, planAmount - totalPaid)

      // Fetch attendance count
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', id)
        .eq('meal_taken', 'present')

      setCustomer({
        ...customerData,
        subscription: subscriptionData,
        total_paid: totalPaid,
        pending_amount: pendingAmount,
        attendance_count: attendanceCount || 0
      })

    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const phone = customer?.whatsapp_number || customer?.mobile_number
    if (phone) {
      window.open(`https://wa.me/91${phone}`, '_blank')
    }
  }

  const handleCall = () => {
    if (customer?.mobile_number) {
      window.open(`tel:+91${customer.mobile_number}`, '_blank')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Customer not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{customer.full_name}</h1>
            <p className="text-sm text-gray-500">{customer.mobile_number}</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"
          >
            <Edit2 className="w-5 h-5 text-orange-600" />
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCall}
            className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Call
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-50 text-green-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <UtensilsCrossed className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{customer.attendance_count}</p>
            <p className="text-xs text-gray-500">Meals</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <IndianRupee className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">₹{customer.total_paid.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Paid</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <IndianRupee className="w-5 h-5 text-red-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-red-500">₹{customer.pending_amount.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>

        {/* Subscription Info */}
        {customer.subscription && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
              <h3 className="font-semibold text-orange-800">Active Subscription</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Period</span>
                <span className="font-medium text-gray-800">
                  {formatDate(customer.subscription.start_date)} - {formatDate(customer.subscription.end_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Meal Frequency</span>
                <span className="font-medium text-gray-800 capitalize">
                  {customer.subscription.meal_frequency.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Amount</span>
                <span className="font-medium text-gray-800">
                  ₹{Number(customer.subscription.plan_amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                  customer.subscription.status === 'active' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {customer.subscription.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Customer Details</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer Type</span>
              <span className="font-medium text-gray-800 capitalize">{customer.customer_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Meal Type</span>
              <span className="font-medium text-gray-800 capitalize">{customer.meal_type.replace('_', ' ')}</span>
            </div>
            {customer.address && (
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-800 text-right max-w-[200px]">{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="flex justify-between">
                <span className="text-gray-500">Notes</span>
                <span className="font-medium text-gray-800 text-right max-w-[200px]">{customer.notes}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Member Since</span>
              <span className="font-medium text-gray-800">{formatDate(customer.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Renew Subscription */}
        {customer.subscription && (
          <RenewSubscriptionButton 
            customer={customer}
            onSuccess={fetchCustomerDetail}
          />
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/report/${customer.id}`)}
            className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <FileText className="w-5 h-5" />
            Generate Report
          </button>
          
          {customer.pending_amount > 0 && (
            <button
              onClick={() => navigate('/payments')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <IndianRupee className="w-5 h-5" />
              Record Payment (₹{customer.pending_amount.toLocaleString()} pending)
            </button>
          )}
        </div>

      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchCustomerDetail()
          }}
        />
      )}
    </div>
  )
}

// Edit Customer Modal Component
function EditCustomerModal({ customer, onClose, onSuccess }: {
  customer: CustomerDetail
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: customer.full_name,
    mobile_number: customer.mobile_number,
    whatsapp_number: customer.whatsapp_number || '',
    meal_type: customer.meal_type,
    address: customer.address || '',
    notes: customer.notes || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.mobile_number) {
      alert('Name and Mobile are required')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: formData.full_name,
          mobile_number: formData.mobile_number,
          whatsapp_number: formData.whatsapp_number || formData.mobile_number,
          meal_type: formData.meal_type,
          address: formData.address,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id)

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      console.error('Error updating customer:', error.message)
      alert('Failed to update: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
            <input
              type="tel"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleChange}
              maxLength={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <input
              type="tel"
              name="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={handleChange}
              maxLength={10}
              placeholder="Same as mobile"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
            <select
              name="meal_type"
              value={formData.meal_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
            >
              <option value="veg">Veg</option>
              <option value="non_veg">Non-Veg</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}