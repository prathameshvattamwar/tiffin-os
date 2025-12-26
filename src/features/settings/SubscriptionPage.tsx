import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Crown, Zap, Users, MessageCircle, FileText, Headphones } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface VendorPlan {
  subscription_plan: string
  plan_start_date: string
  plan_end_date: string
}

const PLANS = [
  {
    id: 'starter_monthly',
    name: 'Starter',
    duration: 'Monthly',
    price: 299,
    originalPrice: 299,
    period: '1 month',
    customerLimit: 50,
    features: [
      'Up to 50 Customers',
      'Attendance Tracking',
      'Payment Management',
      'Individual WhatsApp Reports',
      'Menu Management',
      'Priority Support'
    ],
    popular: false
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    duration: 'Monthly',
    price: 449,
    originalPrice: 449,
    period: '1 month',
    customerLimit: 999999,
    features: [
      'Unlimited Customers',
      'Everything in Starter',
      'Bulk WhatsApp Reports',
      'Advanced Analytics',
      'Data Export (CSV)',
      'Priority Support'
    ],
    popular: true
  },
  {
    id: 'starter_quarterly',
    name: 'Starter',
    duration: 'Quarterly',
    price: 799,
    originalPrice: 897,
    period: '3 months',
    customerLimit: 50,
    features: [
      'Up to 50 Customers',
      'Attendance Tracking',
      'Payment Management',
      'Individual WhatsApp Reports',
      'Menu Management',
      'Priority Support'
    ],
    popular: false,
    savings: 98
  },
  {
    id: 'pro_quarterly',
    name: 'Pro',
    duration: 'Quarterly',
    price: 1199,
    originalPrice: 1347,
    period: '3 months',
    customerLimit: 999999,
    features: [
      'Unlimited Customers',
      'Everything in Starter',
      'Bulk WhatsApp Reports',
      'Advanced Analytics',
      'Data Export (CSV)',
      'Priority Support'
    ],
    popular: false,
    savings: 148
  }
]

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [vendorPlan, setVendorPlan] = useState<VendorPlan | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly'>('monthly')

  useEffect(() => {
    fetchVendorPlan()
  }, [])

  const fetchVendorPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('subscription_plan, plan_start_date, plan_end_date')
        .eq('auth_user_id', user.id)
        .single()

      if (vendor) {
        setVendorPlan({
          subscription_plan: vendor.subscription_plan || 'free_trial',
          plan_start_date: vendor.plan_start_date || '',
          plan_end_date: vendor.plan_end_date || ''
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = () => {
    if (!vendorPlan?.plan_end_date) return 0
    const endDate = new Date(vendorPlan.plan_end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getCurrentPlanName = () => {
    const names: Record<string, string> = {
      'free_trial': 'Free Trial',
      'starter_monthly': 'Starter Monthly',
      'starter_quarterly': 'Starter Quarterly',
      'pro_monthly': 'Pro Monthly',
      'pro_quarterly': 'Pro Quarterly'
    }
    return names[vendorPlan?.subscription_plan || 'free_trial'] || 'Free Trial'
  }

  const handleUpgrade = (planId: string) => {
    // TODO: Integrate Razorpay
    alert(`Razorpay integration coming soon!\n\nSelected Plan: ${planId}\n\nContact us on WhatsApp for manual activation.`)
    
    // Open WhatsApp for now
    const message = `Hi! I want to upgrade to ${planId} plan for TiffinOS.`
    window.open(`https://wa.me/919271981229?text=${encodeURIComponent(message)}`, '_blank')
  }

  const filteredPlans = PLANS.filter(plan => 
    billingCycle === 'monthly' 
      ? plan.id.includes('monthly') 
      : plan.id.includes('quarterly')
  )

  const daysRemaining = getDaysRemaining()
  const isTrialExpired = vendorPlan?.subscription_plan === 'free_trial' && daysRemaining <= 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-sm text-gray-500">Choose the best plan for you</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6">

        {/* Current Plan Card */}
        <div className={`rounded-2xl p-5 ${
          isTrialExpired 
            ? 'bg-red-500 text-white' 
            : vendorPlan?.subscription_plan === 'free_trial'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Current Plan</p>
              <p className="font-bold text-xl">{getCurrentPlanName()}</p>
            </div>
          </div>
          
          {vendorPlan?.subscription_plan === 'free_trial' && (
            <div className="bg-white/20 rounded-xl p-3 mt-3">
              {isTrialExpired ? (
                <p className="font-semibold">⚠️ Your trial has expired. Upgrade now!</p>
              ) : (
                <p className="font-semibold">⏰ {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in trial</p>
              )}
            </div>
          )}

          {vendorPlan?.subscription_plan !== 'free_trial' && vendorPlan?.plan_end_date && (
            <div className="bg-white/20 rounded-xl p-3 mt-3">
              <p className="text-sm">Valid until: {new Date(vendorPlan.plan_end_date).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</p>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="bg-white rounded-xl p-2 flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition ${
              billingCycle === 'monthly'
                ? 'bg-orange-500 text-white'
                : 'text-gray-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('quarterly')}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition relative ${
              billingCycle === 'quarterly'
                ? 'bg-orange-500 text-white'
                : 'text-gray-500'
            }`}
          >
            Quarterly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save
            </span>
          </button>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {filteredPlans.map(plan => (
            <div 
              key={plan.id}
              className={`bg-white rounded-2xl border-2 overflow-hidden ${
                plan.popular ? 'border-orange-500' : 'border-gray-100'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="bg-orange-500 text-white text-center py-1.5 text-sm font-semibold">
                  ⭐ Most Popular
                </div>
              )}

              <div className="p-5">
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.name === 'Pro' 
                        ? 'bg-purple-100' 
                        : 'bg-blue-100'
                    }`}>
                      {plan.name === 'Pro' ? (
                        <Zap className={`w-6 h-6 text-purple-600`} />
                      ) : (
                        <Users className={`w-6 h-6 text-blue-600`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.period}</p>
                    </div>
                  </div>
                  
                  {plan.savings && (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Save ₹{plan.savings}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    {plan.savings && (
                      <span className="text-lg text-gray-400 line-through">₹{plan.originalPrice}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">for {plan.period}</p>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3.5 rounded-xl font-semibold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {vendorPlan?.subscription_plan === plan.id ? 'Current Plan' : 'Upgrade Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Free Features */}
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-3">🎁 Free Forever Features</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Basic Attendance',
              'Up to 20 Customers',
              'Payment Tracking',
              'Quick Sale'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Headphones className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
              <p className="text-sm text-gray-500">We're here to assist you</p>
            </div>
          </div>
          <button
            onClick={() => window.open('https://wa.me/919271981229?text=Hi! I need help with TiffinOS subscription.', '_blank')}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </button>
        </div>

      </div>
    </div>
  )
}