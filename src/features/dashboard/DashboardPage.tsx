import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, IndianRupee, UtensilsCrossed, TrendingUp, Plus, CalendarCheck, ShoppingBag, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface DashboardStats {
  totalCustomers: number
  totalPending: number
  todayMeals: number
  thisMonthCollection: number
  expiringCount: number
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [vendorName, setVendorName] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalPending: 0,
    todayMeals: 0,
    thisMonthCollection: 0,
    expiringCount: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, business_name, owner_name')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return
      setVendorName(vendor.business_name || vendor.owner_name || 'User')

      // 1. Total Active Customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)

      // 2. Get all subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, customer_id, plan_amount, end_date, status')
        .eq('vendor_id', vendor.id)
        .eq('status', 'active')

      // 3. Get all payments
      const { data: payments } = await supabase
        .from('payments')
        .select('customer_id, amount, payment_date')
        .eq('vendor_id', vendor.id)

      // 4. Get all attendance for guest charges
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('customer_id, guest_count, lunch_taken, dinner_taken, attendance_date')
        .eq('vendor_id', vendor.id)

      // Calculate stats
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      let totalPending = 0
      let expiringCount = 0

      // Calculate pending for each subscription
      subscriptions?.forEach(sub => {
        // Customer payments
        const customerPayments = payments?.filter(p => p.customer_id === sub.customer_id) || []
        const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        
        // Guest charges (₹40 per guest)
        const customerAttendance = attendanceData?.filter(a => a.customer_id === sub.customer_id) || []
        const totalGuests = customerAttendance.reduce((sum, a) => sum + (a.guest_count || 0), 0)
        const guestCharges = totalGuests * 40
        
        // Pending amount
        const pending = Math.max(0, Number(sub.plan_amount) + guestCharges - totalPaid)
        totalPending += pending

        // Check expiring subscriptions
        const endDate = new Date(sub.end_date)
        if (endDate <= sevenDaysLater && endDate >= today) {
          expiringCount++
        }
      })

      // Today's Meals (lunch + dinner)
      const todayAttendance = attendanceData?.filter(a => a.attendance_date === todayStr) || []
      let todayMeals = 0
      todayAttendance.forEach(a => {
        if (a.lunch_taken) todayMeals++
        if (a.dinner_taken) todayMeals++
      })

      // This Month Collection
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const thisMonthPayments = payments?.filter(p => p.payment_date >= firstOfMonth) || []
      const thisMonthCollection = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

      setStats({
        totalCustomers: customerCount || 0,
        totalPending,
        todayMeals,
        thisMonthCollection,
        expiringCount
      })

    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning! 👋'
    if (hour < 17) return 'Good Afternoon! ☀️'
    return 'Good Evening! 🌙'
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
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{getGreeting()}</h1>
            <p className="text-gray-500">{vendorName}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-bold">
            {vendorName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Expiring Alert */}
        {stats.expiringCount > 0 && (
          <div 
            onClick={() => navigate('/customers')}
            className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-800">{stats.expiringCount} subscription{stats.expiringCount > 1 ? 's' : ''} expiring soon</p>
              <p className="text-sm text-orange-600">Tap to view and renew</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => navigate('/customers')}
            className="bg-white p-4 rounded-xl border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            <p className="text-sm text-gray-500">Total Customers</p>
          </div>

          <div 
            onClick={() => navigate('/payments')}
            className="bg-white p-4 rounded-xl border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
              <IndianRupee className="w-5 h-5 text-red-500" />
            </div>
            <p className={`text-2xl font-bold ${stats.totalPending > 0 ? 'text-red-500' : 'text-gray-900'}`}>
              {formatAmount(stats.totalPending)}
            </p>
            <p className="text-sm text-gray-500">Total Pending</p>
          </div>

          <div 
            onClick={() => navigate('/track')}
            className="bg-white p-4 rounded-xl border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayMeals}</p>
            <p className="text-sm text-gray-500">Today's Meals</p>
          </div>

          <div 
            onClick={() => navigate('/payments')}
            className="bg-white p-4 rounded-xl border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatAmount(stats.thisMonthCollection)}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/track')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
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

        {/* Quick Tip */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="font-semibold text-amber-800 mb-1">💡 Quick Tip</p>
          <p className="text-sm text-amber-700">
            Mark attendance daily to keep accurate records. You can also send payment reminders via WhatsApp directly from the Payments tab.
          </p>
        </div>

      </div>
    </div>
  )
}