import { useState } from 'react'
import { X, IndianRupee } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface CustomerWithPending {
  id: string
  full_name: string
  mobile_number: string
  subscription?: {
    id: string
    plan_amount: number
  }
  total_paid: number
  pending_amount: number
}

interface RecordPaymentModalProps {
  customer: CustomerWithPending
  vendorId: string
  onClose: () => void
  onSuccess: () => void
}

export default function RecordPaymentModal({ customer, vendorId, onClose, onSuccess }: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: customer.pending_amount.toString(),
    payment_type: 'partial',
    payment_mode: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Auto-set payment type based on amount
    if (name === 'amount') {
      const amount = Number(value) || 0
      if (amount >= customer.pending_amount) {
        setFormData(prev => ({ ...prev, [name]: value, payment_type: 'full' }))
      } else {
        setFormData(prev => ({ ...prev, [name]: value, payment_type: 'partial' }))
      }
    }
  }

  const handleQuickAmount = (amount: number) => {
    const paymentType = amount >= customer.pending_amount ? 'full' : 'partial'
    setFormData({ ...formData, amount: amount.toString(), payment_type: paymentType })
  }

  const handleSubmit = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter valid amount')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('payments').insert({
        customer_id: customer.id,
        subscription_id: customer.subscription?.id,
        vendor_id: vendorId,
        amount: Number(formData.amount),
        payment_type: formData.payment_type,
        payment_mode: formData.payment_mode,
        payment_date: formData.payment_date,
        notes: formData.notes,
        status: 'completed'
      })

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      console.error('Error recording payment:', error.message)
      alert('Failed to record payment: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const remainingAfterPayment = Math.max(0, customer.pending_amount - (Number(formData.amount) || 0))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
            <p className="text-sm text-gray-500">{customer.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Pending Info */}
          <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-red-600 font-medium">Pending Amount</span>
            <span className="text-xl font-bold text-red-600">₹{customer.pending_amount.toLocaleString()}</span>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received *</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-lg font-semibold"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickAmount(500)}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              ₹500
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(1000)}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              ₹1000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(2000)}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              ₹2000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(customer.pending_amount)}
              className="flex-1 py-2 bg-green-100 rounded-lg text-sm font-medium text-green-700 hover:bg-green-200"
            >
              Full
            </button>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'cash', label: 'Cash', emoji: '💵' },
                { value: 'upi', label: 'UPI', emoji: '📱' },
                { value: 'card', label: 'Card', emoji: '💳' },
                { value: 'bank_transfer', label: 'Bank', emoji: '🏦' }
              ].map(mode => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_mode: mode.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    formData.payment_mode === mode.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">{mode.emoji}</div>
                  <div className="text-xs font-medium text-gray-800">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">After this payment</span>
              <span className={`text-lg font-bold ${remainingAfterPayment === 0 ? 'text-green-600' : 'text-orange-500'}`}>
                {remainingAfterPayment === 0 ? '✓ Fully Paid' : `₹${remainingAfterPayment.toLocaleString()} pending`}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Recording...' : `Record ₹${Number(formData.amount).toLocaleString()} Payment`}
          </button>

        </div>
      </div>
    </div>
  )
}