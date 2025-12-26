import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MessageCircle, Edit2, Calendar, IndianRupee, UtensilsCrossed, FileText, Users, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Skeleton } from '../../components/ui/Skeleton'

interface CustomerDetail {
  id: string
  full_name: string
  mobile_number: string
  whatsapp_number?: string
  customer_type: string
  meal_type: string
  address?: string
  notes?: string
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
  guest_charges: number
  total_guests: number
}

export default function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) fetchCustomerDetail()
  }, [id])

  const fetchCustomerDetail = async () => {
    setLoading(true)
    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (customerError) throw customerError

      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', id)
        .eq('status', 'active')
        .single()

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('customer_id', id)

      const totalPaid = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const planAmount = subscriptionData?.plan_amount || 0

      // Fetch attendance count
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', id)
        .or('lunch_taken.eq.true,dinner_taken.eq.true')

      // Calculate guest charges
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('guest_count')
        .eq('customer_id', id)

      const totalGuests = attendanceData?.reduce((sum, a) => sum + (a.guest_count || 0), 0) || 0
      const guestCharges = totalGuests * 40 // ₹40 per guest

      const pendingAmount = Math.max(0, planAmount + guestCharges - totalPaid)

      setCustomer({
        ...customerData,
        subscription: subscriptionData,
        total_paid: totalPaid,
        pending_amount: pendingAmount,
        attendance_count: attendanceCount || 0,
        guest_charges: guestCharges,
        total_guests: totalGuests
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async () => {
  setDeleting(true)
    try {
      // Soft delete - mark as deleted with timestamp
      const { error } = await supabase
        .from('customers')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      navigate('/customers')
    } catch (error: any) {
      alert('Error deleting customer: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = () => {
    if (!customer?.subscription) return { label: 'No Plan', color: 'gray' }
    
    const today = new Date()
    const endDate = new Date(customer.subscription.end_date)
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { label: 'Expired', color: 'red' }
    if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'orange' }
    return { label: 'Active', color: 'green' }
  }

    if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-12 rounded-xl" />
            <Skeleton className="flex-1 h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
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

  const status = getStatusBadge()

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
          <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"
          >
            <Edit2 className="w-5 h-5 text-orange-600" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Quick Actions */}
        <div className="flex gap-3">
          <a href={`tel:${customer.mobile_number}`} className="flex-1 bg-blue-50 text-blue-600 p-3 rounded-xl flex items-center justify-center gap-2 font-medium">
            <Phone className="w-5 h-5" />
            Call
          </a>
          <a href={`https://wa.me/91${customer.whatsapp_number || customer.mobile_number}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-50 text-green-600 p-3 rounded-xl flex items-center justify-center gap-2 font-medium">
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <UtensilsCrossed className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{customer.attendance_count}</p>
            <p className="text-xs text-gray-500">Meals</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <IndianRupee className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-600">₹{customer.total_paid.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Paid</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <IndianRupee className="w-5 h-5 text-red-500 mx-auto mb-2" />
            <p className={`text-xl font-bold ${customer.pending_amount > 0 ? 'text-red-500' : 'text-gray-900'}`}>
              ₹{customer.pending_amount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>

        {/* Guest Charges Info */}
        {customer.total_guests > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-blue-800">{customer.total_guests} Guest Meals</p>
              <p className="text-sm text-blue-600">₹{customer.guest_charges} added to pending (₹40/guest)</p>
            </div>
          </div>
        )}

        {/* Subscription Card */}
        {customer.subscription && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Active Subscription</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                status.color === 'green' ? 'bg-green-100 text-green-700' :
                status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                status.color === 'red' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {status.label}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Period</span>
                <span className="font-medium">
                  {formatDate(customer.subscription.start_date)} - {formatDate(customer.subscription.end_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Meal Frequency</span>
                <span className="font-medium capitalize">{customer.subscription.meal_frequency?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Amount</span>
                <span className="font-medium">₹{customer.subscription.plan_amount?.toLocaleString()}</span>
              </div>
              {customer.guest_charges > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Guest Charges</span>
                  <span className="font-medium">+ ₹{customer.guest_charges.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 flex justify-between">
                <span className="font-semibold">Total Due</span>
                <span className="font-bold">₹{(customer.subscription.plan_amount + customer.guest_charges).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Details Card */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Customer Details</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium capitalize">{customer.customer_type?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Meal Type</span>
              <span className="font-medium capitalize">{customer.meal_type}</span>
            </div>
            {customer.address && (
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-right max-w-[60%]">{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="flex justify-between">
                <span className="text-gray-500">Notes</span>
                <span className="font-medium text-right max-w-[60%]">{customer.notes}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Member Since</span>
              <span className="font-medium">{formatDate(customer.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Renew Subscription Button */}
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
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Generate Report
          </button>

          {customer.pending_amount > 0 && (
            <button
              onClick={() => navigate('/payments')}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <IndianRupee className="w-5 h-5" />
              Record Payment
            </button>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Customer?</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{customer.full_name}</span>? 
                You can restore from Recycle Bin later.
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={handleDeleteCustomer}
                  disabled={deleting}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: customer.full_name,
    mobile_number: customer.mobile_number,
    whatsapp_number: customer.whatsapp_number || '',
    meal_type: customer.meal_type,
    address: customer.address || '',
    notes: customer.notes || ''
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: formData.full_name,
          mobile_number: formData.mobile_number,
          whatsapp_number: formData.whatsapp_number || formData.mobile_number,
          meal_type: formData.meal_type,
          address: formData.address,
          notes: formData.notes
        })
        .eq('id', customer.id)

      if (error) throw error
      onSuccess()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Customer</h2>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={formData.mobile_number}
              onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
              maxLength={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <input
              type="tel"
              value={formData.whatsapp_number}
              onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
              maxLength={10}
              placeholder="Same as mobile if empty"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['veg', 'non_veg', 'both'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, meal_type: type })}
                  className={`py-2 rounded-xl border-2 text-sm font-medium capitalize ${
                    formData.meal_type === type
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
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
  const canRenew = daysLeft <= 7
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    plan_amount: customer.subscription?.plan_amount?.toString() || '',
    advance_amount: '',
    payment_mode: 'cash'
  })

  const openModal = () => {
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

      // Mark old subscription as completed
      if (customer.subscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'completed' })
          .eq('id', customer.subscription.id)
      }

      // Create new subscription
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

      // Record advance payment if any
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
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

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