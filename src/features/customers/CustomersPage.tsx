import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Users, Calendar, IndianRupee, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AddCustomerModal from './AddCustomerModal'

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
}

type TabType = 'monthly' | 'walk_in'
type FilterType = 'all' | 'active' | 'expired' | 'pending'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('monthly')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return

      // Fetch all customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      // Fetch all subscriptions
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('vendor_id', vendor.id)

      // Fetch all payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('customer_id, amount')
        .eq('vendor_id', vendor.id)

      // Combine data
      const customersWithDetails: CustomerWithDetails[] = (customersData || []).map(customer => {
        // Get latest subscription for customer
        const customerSubs = subscriptionsData?.filter(s => s.customer_id === customer.id) || []
        const activeSub = customerSubs.find(s => s.status === 'active')
        const latestSub = activeSub || customerSubs.sort((a, b) => 
          new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
        )[0]

        // Calculate payments
        const customerPayments = paymentsData?.filter(p => p.customer_id === customer.id) || []
        const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        const planAmount = latestSub?.plan_amount || 0
        const pendingAmount = Math.max(0, planAmount - totalPaid)

        return {
          ...customer,
          subscription: latestSub,
          pending_amount: pendingAmount,
          total_paid: totalPaid
        }
      })

      setCustomers(customersWithDetails)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

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

    // Filter by status
    const today = new Date().toISOString().split('T')[0]
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(c => 
          c.subscription?.status === 'active' && 
          c.subscription?.end_date >= today
        )
        break
      case 'expired':
        filtered = filtered.filter(c => 
          !c.subscription || 
          c.subscription.end_date < today ||
          c.subscription.status !== 'active'
        )
        break
      case 'pending':
        filtered = filtered.filter(c => c.pending_amount > 0)
        break
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
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                activeFilter !== 'all' 
                  ? 'bg-orange-100 text-orange-600' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            
            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-40 z-20">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'pending', label: 'With Pending' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setActiveFilter(filter.value as FilterType)
                      setShowFilterMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      activeFilter === filter.value ? 'text-orange-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {searchQuery ? 'No results found' : 'No customers yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try a different search' : 'Add your first customer to get started'}
            </p>
            {!searchQuery && (
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
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                      status.color === 'red' ? 'bg-red-400' :
                      status.color === 'orange' ? 'bg-orange-400' :
                      'bg-gradient-to-br from-orange-400 to-amber-400'
                    }`}>
                      {customer.full_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
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
                      
                      {/* Subscription Info */}
                      {customer.subscription && (
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(customer.subscription.end_date)}
                          </span>
                          <span className="text-gray-500 capitalize">
                            {customer.subscription.meal_frequency.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pending + Arrow */}
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchCustomers()
          }}
        />
      )}

      {/* Click outside to close filter */}
      {showFilterMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowFilterMenu(false)}
        />
      )}
    </div>
  )
}