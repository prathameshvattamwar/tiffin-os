import { useState } from 'react'
import { useVendor } from '../../context/VendorContext'
import { useCustomers } from '../../hooks/useQueries'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Users, Calendar, ChevronRight, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AddCustomerModal from './AddCustomerModal'
import { ListSkeleton } from '../../components/ui/Skeleton'

interface CustomerWithDetails {
  id: string
  full_name: string
  mobile_number: string
  customer_type: 'monthly' | 'walk_in'
  meal_type: string
  is_active: boolean
  subscription?: {
    id: string
    start_date: string
    end_date: string
    meal_frequency: string
    plan_amount: number
    status: string
  }
  pending_amount: number
  total_paid: number
  guest_charges: number
}

type TabType = 'monthly' | 'walk_in'
type FilterType = 'all' | 'active' | 'expired' | 'expiring' | 'pending' | 'clear' | 'one_time' | 'two_times'

export default function CustomersPage() {
  const navigate = useNavigate()
  const { vendor } = useVendor()
  const { data: customers = [], isLoading: loading, refetch } = useCustomers()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('monthly')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Filter customers based on tab and filters
  const getFilteredCustomers = () => {
    let filtered = customers

    // Filter by tab (monthly/walk_in)
    filtered = filtered.filter(c => c.customer_type === activeTab)

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile_number.includes(searchQuery)
      )
    }

    // Get today's date for comparisons
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0]

    // Apply filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(c => {
        if (!c.subscription?.end_date) return false
        return c.subscription.end_date >= todayStr
      })
    } else if (activeFilter === 'expired') {
      filtered = filtered.filter(c => {
        if (!c.subscription?.end_date) return true
        return c.subscription.end_date < todayStr
      })
    } else if (activeFilter === 'expiring') {
      filtered = filtered.filter(c => {
        if (!c.subscription?.end_date) return false
        return c.subscription.end_date >= todayStr && c.subscription.end_date <= sevenDaysStr
      })
    } else if (activeFilter === 'pending') {
      filtered = filtered.filter(c => c.pending_amount > 0)
    } else if (activeFilter === 'clear') {
      filtered = filtered.filter(c => c.pending_amount === 0)
    } else if (activeFilter === 'one_time') {
      filtered = filtered.filter(c => c.subscription?.meal_frequency === 'one_time')
    } else if (activeFilter === 'two_times') {
      filtered = filtered.filter(c => c.subscription?.meal_frequency === 'two_times')
    }

    return filtered
  }

  const filteredCustomers = getFilteredCustomers()
  const monthlyCount = customers.filter(c => c.customer_type === 'monthly').length
  const walkInCount = customers.filter(c => c.customer_type === 'walk_in').length

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getSubscriptionStatus = (customer: CustomerWithDetails) => {
    if (!customer.subscription) return { label: 'No Plan', color: 'gray' }
    
    const today = new Date()
    const endDate = new Date(customer.subscription.end_date)
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { label: 'Expired', color: 'red' }
    if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'orange' }
    return { label: 'Active', color: 'green' }
  }

  const getFilterLabel = () => {
    const labels: Record<FilterType, string> = {
      all: 'All',
      active: '🟢 Active',
      expired: '🔴 Expired',
      expiring: '🟠 Expiring',
      pending: '💰 Pending',
      clear: '✅ Clear',
      one_time: '1x Meal',
      two_times: '2x Meals'
    }
    return labels[activeFilter]
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Customers</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Monthly
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'monthly' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {monthlyCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('walk_in')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'walk_in'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Walk-in
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'walk_in' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {walkInCount}
            </span>
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`h-11 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                activeFilter !== 'all' 
                  ? 'bg-orange-100 text-orange-600 border-2 border-orange-300' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFilter !== 'all' && (
                <span className="text-sm font-medium">{getFilterLabel()}</span>
              )}
            </button>
            
            {/* Filter Dropdown */}
            {showFilterMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowFilterMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-14 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-52 z-30">
                  
                  {/* Clear Filter */}
                  {activeFilter !== 'all' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveFilter('all')
                          setShowFilterMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Clear Filter
                      </button>
                      <div className="border-t border-gray-100 my-2"></div>
                    </>
                  )}
                  
                  {/* Status Filters */}
                  <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Status</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter('active')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === 'active' ? 'text-orange-600 font-medium bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    🟢 Active
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter('expired')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === 'expired' ? 'text-orange-600 font-medium bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    🔴 Expired
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter('expiring')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === 'expiring' ? 'text-orange-600 font-medium bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    🟠 Expiring Soon
                  </button>
                  
                  {/* Payment Filters */}
                  <div className="border-t border-gray-100 my-2"></div>
                  <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Payment</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter('pending')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === 'pending' ? 'text-orange-600 font-medium bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    💰 With Pending
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter('clear')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === 'clear' ? 'text-orange-600 font-medium bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    ✅ No Pending
                  </button>
                  
                  {/* Meal Plan Filters */}
                  <div className="border-t border-gray-100 my-2"></div>
                  <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Meal Plan</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter('one_time')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === 'one_time' ? 'text-orange-600 font-medium bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    🍽️ One Time
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter('two_times')
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === 'two_times' ? 'text-orange-600 font-medium bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    🍽️🍽️ Two Times
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active Filter Badge */}
        {activeFilter !== 'all' && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtered by:</span>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
              {getFilterLabel()}
            </span>
            <button 
              onClick={() => setActiveFilter('all')}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Customer List */}
      <div className="px-5 py-4">
        {loading ? (
          <ListSkeleton count={5} />
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {searchQuery || activeFilter !== 'all' ? 'No results found' : 'No customers yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try a different search' : activeFilter !== 'all' ? 'Try a different filter' : 'Add your first customer to get started'}
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-orange-500 text-white px-6 py-2 rounded-xl font-medium"
              >
                Add Customer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 mb-2">
              Showing {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </p>
            
            {filteredCustomers.map((customer) => {
              const status = getSubscriptionStatus(customer)
              
              return (
                <div
                  key={customer.id}
                  onClick={() => navigate(`/customer/${customer.id}`)}
                  className={`bg-white p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition ${
                    status.color === 'red' ? 'border-red-200' :
                    status.color === 'orange' ? 'border-orange-200' :
                    'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                      status.color === 'red' ? 'bg-red-400' :
                      status.color === 'orange' ? 'bg-orange-400' :
                      'bg-gradient-to-br from-orange-400 to-amber-400'
                    }`}>
                      {customer.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{customer.full_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          status.color === 'green' ? 'bg-green-100 text-green-700' :
                          status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                          status.color === 'red' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2">{customer.mobile_number}</p>
                      
                      {customer.subscription && (
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(customer.subscription.end_date)}
                          </span>
                          <span className="text-gray-500 capitalize">
                            {customer.subscription.meal_frequency?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-2">
                      {customer.pending_amount > 0 && (
                        <div>
                          <p className={`font-bold ${customer.pending_amount > 100 ? 'text-red-500' : 'text-orange-500'}`}>
                            ₹{customer.pending_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">pending</p>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}