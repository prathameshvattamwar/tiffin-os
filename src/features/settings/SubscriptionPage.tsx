import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Crown, Zap, Users, MessageCircle, Headphones, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface VendorPlan {
  subscription_plan: string
  plan_start_date: string
  plan_end_date: string
}

/* 
// PLANS - Commented for future use when Razorpay is integrated
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
*/

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [vendorPlan, setVendorPlan] = useState<VendorPlan | null>(null)

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
    if (!vendorPlan?.plan_end_date) return 30
    const endDate = new Date(vendorPlan.plan_end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

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
            <p className="text-sm text-gray-500">Manage your TiffinOS plan</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6">

        {/* Current Plan Card - Free Trial */}
        <div className={`rounded-2xl p-5 ${
          isTrialExpired 
            ? 'bg-red-500 text-white' 
            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Current Plan</p>
              <p className="font-bold text-xl">Free Trial</p>
            </div>
          </div>
          
          <div className="bg-white/20 rounded-xl p-3 mt-3">
            {isTrialExpired ? (
              <p className="font-semibold">⚠️ Your trial has expired. Contact us for paid plans!</p>
            ) : (
              <p className="font-semibold">⏰ {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in trial</p>
            )}
          </div>
        </div>

        {/* Free Plan Features */}
        <div className="bg-white rounded-2xl border-2 border-green-500 overflow-hidden">
          <div className="bg-green-500 text-white text-center py-2 text-sm font-semibold">
            ✅ Your Active Plan
          </div>
          
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Free Trial</h3>
                <p className="text-sm text-gray-500">30 days • No credit card required</p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-green-600">₹0</span>
              <span className="text-gray-500 ml-2">forever free features</span>
            </div>

            <div className="space-y-2 mb-4">
              {[
                'Up to 30 Customers',
                'Attendance Tracking (Quick Mark + Calendar)',
                'Payment Management',
                'WhatsApp Reports',
                'Menu Management',
                'Quick Sale (Walk-in)',
                '3 Excel Reports / Month'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-green-700 font-medium">🎉 You're on this plan!</p>
            </div>
          </div>
        </div>

        {/* Starter Plan - Coming Soon */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden opacity-75">
          <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
          
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Starter</h3>
                <p className="text-sm text-gray-500">For growing businesses</p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Coming Soon!</p>
              <p className="text-gray-500 text-sm mt-1">Up to 50 customers & more features</p>
            </div>
          </div>
        </div>

        {/* Pro Plan - Coming Soon */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden opacity-75">
          <div className="bg-purple-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
          
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Pro</h3>
                <p className="text-sm text-gray-500">For large scale operations</p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Coming Soon!</p>
              <p className="text-gray-500 text-sm mt-1">Unlimited customers & advanced analytics</p>
            </div>
          </div>
        </div>

        {/* Notify Me */}
        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <h3 className="font-bold text-orange-800 mb-2">🔔 Get Notified</h3>
          <p className="text-sm text-orange-700 mb-4">
            Want to know when paid plans launch? Contact us and we'll notify you first!
          </p>
          <button
            onClick={() => window.open('https://wa.me/919271981229?text=Hi! Please notify me when TiffinOS paid plans launch.', '_blank')}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold"
          >
            🔔 Notify Me on WhatsApp
          </button>
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
            onClick={() => window.open('https://wa.me/919271981229?text=Hi! I need help with TiffinOS.', '_blank')}
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