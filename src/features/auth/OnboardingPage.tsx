import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Building2, User, Phone, MessageCircle, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import TermsConditionsModal from '../../components/TermsConditionsModal'
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal'

const steps = [
  { id: 1, title: 'Business Info' },
  { id: 2, title: 'Contact' },
  { id: 3, title: 'Finish' }
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    mobile_number: '',
    whatsapp_number: '',
    business_type: 'tiffin',
    address: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    if (currentStep === 1 && (!formData.business_name || !formData.owner_name)) {
      alert('Please fill required fields')
      return
    }
    if (currentStep === 2 && !formData.mobile_number) {
      alert('Please enter mobile number')
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      alert('Please accept Terms & Conditions')
      return
    }
    
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('vendors').insert({
        auth_user_id: user.id,
        business_name: formData.business_name,
        owner_name: formData.owner_name,
        mobile_number: formData.mobile_number,
        whatsapp_number: formData.whatsapp_number || formData.mobile_number,
        business_type: formData.business_type,
        address: formData.address,
        is_onboarded: true
      })

      if (error) throw error

      window.location.href = '/'
    } catch (error: any) {
      console.error('Onboarding error:', error.message)
      alert('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">TiffinOS</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  currentStep >= step.id ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 lg:w-24 h-1 mx-2 rounded-full transition-all duration-300 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 lg:p-10">
          
          {/* Step 1: Business Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Business Details</h2>
                <p className="text-gray-500 mt-1">Tell us about your tiffin/mess business</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="e.g., Shree Ganesh Tiffin Service"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Owner Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'tiffin', label: 'Tiffin', icon: '🍱' },
                    { value: 'mess', label: 'Mess', icon: '🍽️' },
                    { value: 'both', label: 'Both', icon: '✨' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, business_type: type.value })}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        formData.business_type === type.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-semibold">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Contact Details</h2>
                <p className="text-gray-500 mt-1">How can customers reach you?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  <input
                    type="tel"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleChange}
                    placeholder="Same as mobile (leave empty)"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Shop/Kitchen address (optional)"
                    rows={3}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Finish */}
          {currentStep === 3 && (
            <div className="py-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">You're all set!</h2>
                <p className="text-gray-500 mb-8">Review your details and start using TiffinOS</p>
              </div>
              
              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-500">Business Name</span>
                  <span className="font-semibold text-gray-800">{formData.business_name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-500">Owner</span>
                  <span className="font-semibold text-gray-800">{formData.owner_name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-500">Mobile</span>
                  <span className="font-semibold text-gray-800">+91 {formData.mobile_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Type</span>
                  <span className="font-semibold text-gray-800 capitalize">{formData.business_type}</span>
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-orange-600 font-semibold underline"
                  >
                    Terms & Conditions
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-orange-600 font-semibold underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-10">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !acceptedTerms}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : '🚀 Start Using TiffinOS'}
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Your data is secure and will never be shared
        </p>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsConditionsModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAcceptedTerms(true)
          setShowTermsModal(false)
        }}
      />
      <TermsConditionsModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAcceptedTerms(true)
          setShowTermsModal(false)
        }}
      />

      <PrivacyPolicyModal 
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
    
  )
}