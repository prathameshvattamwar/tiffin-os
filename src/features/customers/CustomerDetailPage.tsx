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