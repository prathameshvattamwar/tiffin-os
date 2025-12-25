import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, IndianRupee, UtensilsCrossed, TrendingUp, Plus, CalendarCheck, ChevronRight, ShoppingBag} from 'lucide-react'
import { supabase } from '../../lib/supabase'


interface DashboardStats {
  totalCustomers: number
  totalPending: number
  todayMeals: number
  monthRevenue: number
  vendorName: string
  businessName: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalPending: 0,
    todayMeals: 0,
    monthRevenue: 0,
    vendorName: '',
    businessName: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get vendor info
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, owner_name, business_name')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return

      // Get total active customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)

      // Get active subscriptions with plan amounts
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, plan_amount, customer_id')
        .eq('vendor_id', vendor.id)
        .eq('status', 'active')

      // Get all payments for this vendor
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, customer_id, payment_date')
        .eq('vendor_id', vendor.id)

      // Calculate total pending
      let totalPending = 0
      subscriptions?.forEach(sub => {
        const customerPayments = payments?.filter(p => p.customer_id === sub.customer_id) || []
        const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        totalPending += Math.max(0, Number(sub.plan_amount) - totalPaid)
      })

      // Get today's attendance count
      const today = new Date().toISOString().split('T')[0]
      const { count: todayMeals } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .eq('attendance_date', today)
        .eq('meal_taken', 'present')

      // Get this month's revenue
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      const monthStart = firstOfMonth.toISOString().split('T')[0]
      
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('vendor_id', vendor.id)
        .gte('payment_date', monthStart)

      const monthRevenue = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      setStats({
        totalCustomers: customerCount || 0,
        totalPending,
        todayMeals: todayMeals || 0,
        monthRevenue,
        vendorName: vendor.owner_name,
        businessName: vendor.business_name
      })

    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{getGreeting()}! 👋</h1>
            <p className="text-sm text-gray-500">{stats.businessName}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
            {stats.vendorName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => navigate('/customers')}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            <p className="text-sm text-gray-500">Customers</p>
          </div>

          <div 
            onClick={() => navigate('/payments')}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-red-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalPending)}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>

          <div 
            onClick={() => navigate('/track')}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayMeals}</p>
            <p className="text-sm text-gray-500">Today's Meals</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.monthRevenue)}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/track')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-5 h-5" />
              Mark Today's Attendance
            </button>
            
            <button 
              onClick={() => navigate('/customers')}
              className="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Customer
            </button>

            <button 
              onClick={() => navigate('/quick-sale')}
              className="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Quick Sale (Walk-in)
            </button>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <h3 className="font-semibold text-gray-800 mb-2">💡 Quick Tip</h3>
          <p className="text-sm text-gray-600">
            Mark attendance daily to keep accurate records. You can also send payment reminders via WhatsApp directly from the Payments tab.
          </p>
        </div>

      </div>
    </div>
  )
}