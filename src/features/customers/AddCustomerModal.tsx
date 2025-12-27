import { useState } from 'react'
import { X, User, Phone, MessageCircle, Calendar, IndianRupee, ChevronRight, ChevronLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface AddCustomerModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddCustomerModal({ onClose, onSuccess }: AddCustomerModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    address: '',
    // Step 2: Meal Plan
    customer_type: 'monthly',
    meal_frequency: 'two_times',
    meal_type: 'veg',
    // Meal Preferences (NEW)
    preferred_meal: 'lunch', // for one_time: 'lunch' or 'dinner'
    lunch_meal_type: 'chapati_bhaji', // 'chapati_bhaji', 'rice_plate', 'both'
    dinner_meal_type: 'chapati_bhaji',
    // Step 3: Subscription
    start_date: '',
    end_date: '',
    plan_amount: '',
    // Step 4: Payment
    advance_amount: '',
    payment_mode: 'cash',
    notes: ''
  })

  // Auto-calculate end date (1 month from start)
  const calculateEndDate = (startDate: string) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + 1)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  // Set end date when start date changes
  const handleStartDateChange = (value: string) => {
    setFormData({
      ...formData,
      start_date: value,
      end_date: calculateEndDate(value)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'start_date') {
      handleStartDateChange(value)
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Calculate pending amount
  const pendingAmount = Math.max(0, (Number(formData.plan_amount) || 0) - (Number(formData.advance_amount) || 0))

  const validateStep = () => {
    if (step === 1 && (!formData.full_name || !formData.mobile_number)) {
      alert('Please fill Name and Mobile Number')
      return false
    }
    if (step === 3 && (!formData.start_date || !formData.plan_amount)) {
      alert('Please fill Start Date and Plan Amount')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
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

      // 1. Create Customer with meal preferences
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          vendor_id: vendor.id,
          full_name: formData.full_name,
          mobile_number: formData.mobile_number,
          whatsapp_number: formData.whatsapp_number || formData.mobile_number,
          customer_type: formData.customer_type,
          meal_type: formData.meal_type,
          address: formData.address,
          notes: formData.notes,
          is_active: true,
          // Meal Preferences
          preferred_meal: formData.preferred_meal,
          lunch_meal_type: formData.lunch_meal_type,
          dinner_meal_type: formData.dinner_meal_type
        })
        .select()
        .single()

      if (customerError) throw customerError

      // 2. Create Subscription (for monthly customers)
      if (formData.customer_type === 'monthly') {
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: customer.id,
            vendor_id: vendor.id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            meal_frequency: formData.meal_frequency,
            plan_amount: Number(formData.plan_amount),
            status: 'active'
          })
          .select()
          .single()

        if (subError) throw subError

        // 3. Record Advance Payment (if any)
        if (Number(formData.advance_amount) > 0) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              customer_id: customer.id,
              subscription_id: subscription.id,
              vendor_id: vendor.id,
              amount: Number(formData.advance_amount),
              payment_type: 'advance',
              payment_mode: formData.payment_mode,
              payment_date: formData.start_date,
              status: 'completed'
            })

          if (paymentError) throw paymentError
        }
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error adding customer:', error.message)
      alert('Failed to add customer: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Add Customer</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div className={`h-1.5 w-full rounded-full transition-colors ${
                  s <= step ? 'bg-orange-500' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Basic</span>
            <span>Plan</span>
            <span>Period</span>
            <span>Payment</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-5">
          
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Customer Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Customer name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  <input
                    type="tel"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleChange}
                    placeholder="Same as mobile (leave empty)"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Delivery address (optional)"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Meal Plan */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Meal Plan</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'monthly', label: 'Monthly', desc: 'Regular subscription' },
                    { value: 'walk_in', label: 'Walk-in', desc: 'Pay per meal' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, customer_type: type.value })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.customer_type === type.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.customer_type === 'monthly' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meal Frequency</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'one_time', label: 'One Time', emoji: '🍽️', desc: 'Lunch या Dinner' },
                        { value: 'two_times', label: 'Two Times', emoji: '🍽️🍽️', desc: 'Lunch + Dinner' }
                      ].map(freq => (
                        <button
                          key={freq.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, meal_frequency: freq.value })}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            formData.meal_frequency === freq.value
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{freq.emoji}</div>
                          <div className="font-semibold text-gray-800">{freq.label}</div>
                          <div className="text-xs text-gray-500">{freq.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ONE TIME - Select which meal */}
                  {formData.meal_frequency === 'one_time' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Which Meal? 🕐</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'lunch', label: 'Lunch', emoji: '🌅', desc: 'दुपारचे जेवण' },
                            { value: 'dinner', label: 'Dinner', emoji: '🌙', desc: 'रात्रीचे जेवण' }
                          ].map(meal => (
                            <button
                              key={meal.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, preferred_meal: meal.value })}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                formData.preferred_meal === meal.value
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{meal.emoji}</div>
                              <div className="font-semibold text-gray-800">{meal.label}</div>
                              <div className="text-xs text-gray-500">{meal.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formData.preferred_meal === 'lunch' ? '🌅 Lunch' : '🌙 Dinner'} मध्ये काय?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'chapati_bhaji', label: 'Chapati Bhaji', emoji: '🫓' },
                            { value: 'rice_plate', label: 'Rice Plate', emoji: '🍚' }
                          ].map(type => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData({ 
                                ...formData, 
                                lunch_meal_type: formData.preferred_meal === 'lunch' ? type.value : formData.lunch_meal_type,
                                dinner_meal_type: formData.preferred_meal === 'dinner' ? type.value : formData.dinner_meal_type
                              })}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                (formData.preferred_meal === 'lunch' ? formData.lunch_meal_type : formData.dinner_meal_type) === type.value
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.emoji}</div>
                              <div className="font-semibold text-gray-800">{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* TWO TIMES - Select meal type for each */}
                  {formData.meal_frequency === 'two_times' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">🌅 Lunch मध्ये काय?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'chapati_bhaji', label: 'Chapati Bhaji', emoji: '🫓' },
                            { value: 'rice_plate', label: 'Rice Plate', emoji: '🍚' }
                          ].map(type => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, lunch_meal_type: type.value })}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                formData.lunch_meal_type === type.value
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.emoji}</div>
                              <div className="font-semibold text-gray-800">{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">🌙 Dinner मध्ये काय?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'chapati_bhaji', label: 'Chapati Bhaji', emoji: '🫓' },
                            { value: 'rice_plate', label: 'Rice Plate', emoji: '🍚' }
                          ].map(type => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, dinner_meal_type: type.value })}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                formData.dinner_meal_type === type.value
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.emoji}</div>
                              <div className="font-semibold text-gray-800">{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type (Veg/Non-Veg)</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'veg', label: 'Veg', emoji: '🥬' },
                        { value: 'non_veg', label: 'Non-Veg', emoji: '🍗' },
                        { value: 'both', label: 'Both', emoji: '🍱' }
                      ].map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, meal_type: type.value })}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            formData.meal_type === type.value
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xl mb-1">{type.emoji}</div>
                          <div className="text-sm font-medium text-gray-800">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Subscription Period */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Subscription Period</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Amount *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="plan_amount"
                    value={formData.plan_amount}
                    onChange={handleChange}
                    placeholder="3000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Meal Summary */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">📋 Meal Summary</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {formData.meal_frequency === 'two_times' ? (
                    <>
                      <p>🌅 Lunch: {formData.lunch_meal_type === 'chapati_bhaji' ? 'Chapati Bhaji' : 'Rice Plate'}</p>
                      <p>🌙 Dinner: {formData.dinner_meal_type === 'chapati_bhaji' ? 'Chapati Bhaji' : 'Rice Plate'}</p>
                    </>
                  ) : (
                    <p>
                      {formData.preferred_meal === 'lunch' ? '🌅 Lunch' : '🌙 Dinner'}: {' '}
                      {(formData.preferred_meal === 'lunch' ? formData.lunch_meal_type : formData.dinner_meal_type) === 'chapati_bhaji' 
                        ? 'Chapati Bhaji' 
                        : 'Rice Plate'}
                    </p>
                  )}
                  <p className="text-blue-600 capitalize">Type: {formData.meal_type.replace('_', '-')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Payment Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="advance_amount"
                    value={formData.advance_amount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

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
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{mode.emoji}</div>
                      <div className="text-xs font-medium text-gray-800">{mode.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan Amount</span>
                    <span className="font-medium">₹{formData.plan_amount || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Advance Paid</span>
                    <span className="font-medium text-green-600">- ₹{formData.advance_amount || '0'}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-800">Pending</span>
                    <span className={`font-bold ${pendingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{pendingAmount}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Special notes (optional)"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-1"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Adding...' : '✓ Add Customer'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}