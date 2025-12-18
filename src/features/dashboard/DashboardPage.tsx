import { Users, IndianRupee, UtensilsCrossed, TrendingUp, Plus, CalendarCheck, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{getGreeting()}! 👋</h1>
            <p className="text-sm text-gray-500">Shree Ganesh Tiffin Service</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
            S
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">+5</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">68</p>
            <p className="text-sm text-gray-500">Customers</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-red-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">₹18.5K</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">124</p>
            <p className="text-sm text-gray-500">Today's Meals</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">↑ 12%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹1.2L</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2">
              <CalendarCheck className="w-5 h-5" />
              Mark Today's Attendance
            </button>
            
            <button className="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Customer
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Activity</h2>
            <button className="text-sm text-orange-500 font-medium">View All</button>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Payment received</p>
                <p className="text-xs text-gray-500">Amit Sharma paid ₹3,000</p>
              </div>
              <span className="text-xs text-gray-400">2m ago</span>
            </div>
            
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New customer</p>
                <p className="text-xs text-gray-500">Priya Patil added</p>
              </div>
              <span className="text-xs text-gray-400">1h ago</span>
            </div>
            
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Attendance marked</p>
                <p className="text-xs text-gray-500">65 customers present today</p>
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}