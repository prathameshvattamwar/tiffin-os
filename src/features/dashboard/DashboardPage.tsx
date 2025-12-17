import { Users, IndianRupee, UtensilsCrossed, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Good Morning! 🙏</h1>
        <p className="text-gray-500">Shree Ganesh Tiffin Service</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">68</p>
          <p className="text-sm text-gray-500">Customers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
            <IndianRupee className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">₹18.5K</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">124</p>
          <p className="text-sm text-gray-500">Today's Meals</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">₹1.2L</p>
          <p className="text-sm text-gray-500">This Month</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button className="w-full bg-orange-500 text-white p-4 rounded-2xl font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2">
          ✓ Mark Today's Attendance
        </button>
        
        <button className="w-full bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-2xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
          👤 Add New Customer
        </button>
      </div>
    </div>
  )
}