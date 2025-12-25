import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Check, Users, Plus, Minus, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Customer {
  id: string
  full_name: string
  mobile_number: string
  subscription?: {
    id: string
    start_date: string
    end_date: string
    meal_frequency: string
  }
}

interface AttendanceRecord {
  attendance_date: string
  lunch_taken: boolean
  dinner_taken: boolean
  guest_count: number
  is_cancelled: boolean
  notes: string
}

export default function AttendancePage() {
  const [mode, setMode] = useState<'quick' | 'calendar'>('quick')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)
  
  // Customer search states
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Quick mode states
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [quickAttendance, setQuickAttendance] = useState<Map<string, { lunch: boolean; dinner: boolean; guests: number }>>(new Map())
  
  // Calendar mode states
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [customerAttendance, setCustomerAttendance] = useState<Map<string, AttendanceRecord>>(new Map())
  const [showDayModal, setShowDayModal] = useState<string | null>(null)
  const [dayFormData, setDayFormData] = useState({
    lunch: false,
    dinner: false,
    guests: 0,
    cancelled: false,
    notes: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (mode === 'quick') {
      fetchQuickAttendance()
    }
  }, [selectedDate, mode])

  useEffect(() => {
    if (selectedCustomer && mode === 'calendar') {
      fetchCustomerAttendance()
    }
  }, [selectedCustomer, currentMonth, mode])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return
      setVendorId(vendor.id)

      const { data: customersData } = await supabase
        .from('customers')
        .select(`
          id, full_name, mobile_number,
          subscriptions (id, start_date, end_date, meal_frequency, status)
        `)
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('full_name')

      const customersWithSub = (customersData || []).map((c: any) => ({
        ...c,
        subscription: c.subscriptions?.find((s: any) => s.status === 'active')
      }))

      setCustomers(customersWithSub)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuickAttendance = async () => {
    if (!vendorId) return
    
    const dateStr = selectedDate.toISOString().split('T')[0]
    const { data } = await supabase
      .from('attendance')
      .select('customer_id, lunch_taken, dinner_taken, guest_count')
      .eq('vendor_id', vendorId)
      .eq('attendance_date', dateStr)

    const map = new Map<string, { lunch: boolean; dinner: boolean; guests: number }>()
    data?.forEach(r => {
      map.set(r.customer_id, {
        lunch: r.lunch_taken || false,
        dinner: r.dinner_taken || false,
        guests: r.guest_count || 0
      })
    })
    setQuickAttendance(map)
  }

  const fetchCustomerAttendance = async () => {
    if (!vendorId || !selectedCustomer) return

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('attendance')
      .select('attendance_date, lunch_taken, dinner_taken, guest_count, is_cancelled, notes')
      .eq('customer_id', selectedCustomer.id)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)

    const map = new Map<string, AttendanceRecord>()
    data?.forEach(r => {
      map.set(r.attendance_date, {
        attendance_date: r.attendance_date,
        lunch_taken: r.lunch_taken || false,
        dinner_taken: r.dinner_taken || false,
        guest_count: r.guest_count || 0,
        is_cancelled: r.is_cancelled || false,
        notes: r.notes || ''
      })
    })
    setCustomerAttendance(map)
  }

  // Quick mode: Toggle meal
  const toggleQuickMeal = async (customerId: string, meal: 'lunch' | 'dinner') => {
    if (!vendorId) return

    const current = quickAttendance.get(customerId) || { lunch: false, dinner: false, guests: 0 }
    const updated = { ...current, [meal]: !current[meal] }

    // Optimistic update
    const newMap = new Map(quickAttendance)
    newMap.set(customerId, updated)
    setQuickAttendance(newMap)

    const dateStr = selectedDate.toISOString().split('T')[0]
    await supabase.from('attendance').upsert({
      customer_id: customerId,
      vendor_id: vendorId,
      attendance_date: dateStr,
      lunch_taken: updated.lunch,
      dinner_taken: updated.dinner,
      guest_count: updated.guests,
      meal_taken: (updated.lunch || updated.dinner) ? 'present' : 'absent'
    }, { onConflict: 'customer_id,attendance_date' })
  }

  const updateQuickGuests = async (customerId: string, change: number) => {
    if (!vendorId) return

    const current = quickAttendance.get(customerId) || { lunch: false, dinner: false, guests: 0 }
    const newGuests = Math.max(0, current.guests + change)
    const updated = { ...current, guests: newGuests }

    const newMap = new Map(quickAttendance)
    newMap.set(customerId, updated)
    setQuickAttendance(newMap)

    const dateStr = selectedDate.toISOString().split('T')[0]
    await supabase.from('attendance').upsert({
      customer_id: customerId,
      vendor_id: vendorId,
      attendance_date: dateStr,
      lunch_taken: updated.lunch,
      dinner_taken: updated.dinner,
      guest_count: newGuests,
      meal_taken: (updated.lunch || updated.dinner) ? 'present' : 'absent'
    }, { onConflict: 'customer_id,attendance_date' })
  }

  // Calendar helpers
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const getDateStr = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month, day).toISOString().split('T')[0]
  }

  const isDateInSubscription = (day: number) => {
    if (!selectedCustomer?.subscription) return true
    const dateStr = getDateStr(day)
    const start = selectedCustomer.subscription.start_date
    const end = selectedCustomer.subscription.end_date
    return dateStr >= start && dateStr <= end
  }

  const isFutureDate = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return checkDate > today
  }

  const openDayModal = (day: number) => {
    if (isFutureDate(day) || !isDateInSubscription(day)) return
    
    const dateStr = getDateStr(day)
    const record = customerAttendance.get(dateStr)
    
    setDayFormData({
      lunch: record?.lunch_taken || false,
      dinner: record?.dinner_taken || false,
      guests: record?.guest_count || 0,
      cancelled: record?.is_cancelled || false,
      notes: record?.notes || ''
    })
    setShowDayModal(dateStr)
  }

  const saveDayAttendance = async () => {
    if (!vendorId || !selectedCustomer || !showDayModal) return

    await supabase.from('attendance').upsert({
      customer_id: selectedCustomer.id,
      vendor_id: vendorId,
      attendance_date: showDayModal,
      lunch_taken: dayFormData.lunch,
      dinner_taken: dayFormData.dinner,
      guest_count: dayFormData.guests,
      is_cancelled: dayFormData.cancelled,
      notes: dayFormData.notes,
      meal_taken: dayFormData.cancelled ? 'cancelled' : (dayFormData.lunch || dayFormData.dinner) ? 'present' : 'absent'
    }, { onConflict: 'customer_id,attendance_date' })

    setShowDayModal(null)
    fetchCustomerAttendance()
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    if (newDate <= new Date()) setSelectedDate(newDate)
  }

  const formatDate = (date: Date) => date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Stats
  const lunchCount = Array.from(quickAttendance.values()).filter(a => a.lunch).length
  const dinnerCount = Array.from(quickAttendance.values()).filter(a => a.dinner).length
  const guestCount = Array.from(quickAttendance.values()).reduce((sum, a) => sum + a.guests, 0)

  // Filter customers for search
  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.mobile_number.includes(customerSearch)
  )

  // Select customer handler
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch('')
    setShowCustomerDropdown(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 mb-3">Attendance</h1>
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => { setMode('quick'); setSelectedCustomer(null); setCustomerSearch('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === 'quick' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Quick Mark
          </button>
          <button
            onClick={() => setMode('calendar')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Calendar View
          </button>
        </div>

        {mode === 'quick' ? (
          <>
            {/* Date Selector */}
            <div className="flex items-center justify-between bg-gray-100 rounded-xl p-2 mb-4">
              <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{formatDate(selectedDate)}</p>
                {isToday && <p className="text-xs text-orange-500 font-medium">Today</p>}
              </div>
              <button onClick={() => changeDate(1)} disabled={isToday} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg disabled:opacity-30">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-orange-600">{lunchCount}</p>
                <p className="text-xs text-orange-600">Lunch</p>
              </div>
              <div className="flex-1 bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{dinnerCount}</p>
                <p className="text-xs text-purple-600">Dinner</p>
              </div>
              <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{guestCount}</p>
                <p className="text-xs text-blue-600">Guests</p>
              </div>
            </div>
          </>
        ) : (
          /* Customer Selector for Calendar - Searchable Dropdown */
          <div className="relative" ref={dropdownRef}>
            {/* Selected Customer Display OR Search Input */}
            {selectedCustomer && !showCustomerDropdown ? (
              <div 
                onClick={() => setShowCustomerDropdown(true)}
                className="flex items-center gap-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-xl cursor-pointer"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedCustomer.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedCustomer.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {selectedCustomer.subscription?.meal_frequency?.replace('_', ' ') || 'No Plan'}
                  </p>
                </div>
                <span className="text-xs text-orange-600 font-medium">Change</span>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            )}

            {/* Customer Dropdown List */}
            {showCustomerDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-20">
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No customers found
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          selectedCustomer?.id === customer.id
                            ? 'bg-orange-50 border-2 border-orange-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {customer.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{customer.full_name}</p>
                          <p className="text-xs text-gray-500">{customer.mobile_number}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                          {customer.subscription?.meal_frequency?.replace('_', ' ') || 'No Plan'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : mode === 'quick' ? (
          /* Quick Mark List */
          <div className="space-y-2">
            {customers.map(customer => {
              const data = quickAttendance.get(customer.id) || { lunch: false, dinner: false, guests: 0 }
              const mealFreq = customer.subscription?.meal_frequency
              
              return (
                <div key={customer.id} className="bg-white p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {customer.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{customer.full_name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{mealFreq?.replace('_', ' ') || 'No Plan'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Lunch Button */}
                    <button
                      onClick={() => toggleQuickMeal(customer.id, 'lunch')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 ${
                        data.lunch 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-100 text-gray-500 hover:bg-orange-100'
                      }`}
                    >
                      {data.lunch && <Check className="w-4 h-4" />}
                      Lunch
                    </button>
                    
                    {/* Dinner Button - only show if two_times */}
                    {mealFreq === 'two_times' && (
                      <button
                        onClick={() => toggleQuickMeal(customer.id, 'dinner')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 ${
                          data.dinner 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-500 hover:bg-purple-100'
                        }`}
                      >
                        {data.dinner && <Check className="w-4 h-4" />}
                        Dinner
                      </button>
                    )}
                    
                    {/* Guest Counter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuickGuests(customer.id, -1)}
                        disabled={data.guests === 0}
                        className="w-8 h-8 rounded flex items-center justify-center text-gray-500 disabled:opacity-30"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`w-8 text-center font-semibold ${data.guests > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {data.guests}
                      </span>
                      <button
                        onClick={() => updateQuickGuests(customer.id, 1)}
                        className="w-8 h-8 rounded flex items-center justify-center text-blue-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : !selectedCustomer ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Select a customer to view calendar</p>
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Month Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gray-50">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-100 p-px">
              {getDaysInMonth().map((day, idx) => {
                if (!day) return <div key={idx} className="bg-white aspect-square" />

                const dateStr = getDateStr(day)
                const record = customerAttendance.get(dateStr)
                const inSub = isDateInSubscription(day)
                const future = isFutureDate(day)
                const hasLunch = record?.lunch_taken
                const hasDinner = record?.dinner_taken
                const hasGuests = (record?.guest_count || 0) > 0
                const isCancelled = record?.is_cancelled

                return (
                  <button
                    key={idx}
                    onClick={() => openDayModal(day)}
                    disabled={future || !inSub}
                    className={`bg-white aspect-square flex flex-col items-center justify-center text-sm relative transition
                      ${!inSub ? 'opacity-30' : ''}
                      ${future ? 'opacity-50' : ''}
                      ${!future && inSub ? 'hover:bg-gray-50 cursor-pointer' : ''}
                    `}
                  >
                    <span className={`${isCancelled ? 'text-red-400 line-through' : ''}`}>{day}</span>
                    
                    {/* Indicators */}
                    <div className="flex gap-0.5 mt-1">
                      {hasLunch && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                      {hasDinner && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                      {hasGuests && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      {isCancelled && <div className="w-2 h-2 rounded-full bg-red-400" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500" /> Lunch</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500" /> Dinner</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500" /> Guest</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400" /> Cancelled</div>
            </div>
          </div>
        )}
      </div>

      {/* Day Modal */}
      {showDayModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowDayModal(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {new Date(showDayModal).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <p className="text-sm text-gray-500">{selectedCustomer?.full_name}</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Meal Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayFormData.lunch}
                    onChange={e => setDayFormData({ ...dayFormData, lunch: e.target.checked, cancelled: false })}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="font-medium text-gray-800">🍛 Lunch</span>
                </label>

                {selectedCustomer?.subscription?.meal_frequency === 'two_times' && (
                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayFormData.dinner}
                      onChange={e => setDayFormData({ ...dayFormData, dinner: e.target.checked, cancelled: false })}
                      className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="font-medium text-gray-800">🍽️ Dinner</span>
                  </label>
                )}
              </div>

              {/* Guest Counter */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-800">👥 Guests</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDayFormData({ ...dayFormData, guests: Math.max(0, dayFormData.guests - 1) })}
                    className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-lg">{dayFormData.guests}</span>
                  <button
                    onClick={() => setDayFormData({ ...dayFormData, guests: dayFormData.guests + 1 })}
                    className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cancelled */}
              <label className="flex items-center gap-3 p-4 bg-red-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={dayFormData.cancelled}
                  onChange={e => setDayFormData({ ...dayFormData, cancelled: e.target.checked, lunch: false, dinner: false })}
                  className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="font-medium text-red-700">❌ Mark as Cancelled</span>
              </label>

              {/* Notes */}
              <textarea
                placeholder="Notes (optional)"
                value={dayFormData.notes}
                onChange={e => setDayFormData({ ...dayFormData, notes: e.target.value })}
                className="w-full p-4 bg-gray-50 rounded-xl border-0 resize-none focus:ring-2 focus:ring-orange-500"
                rows={2}
              />

              {/* Save Button */}
              <button
                onClick={saveDayAttendance}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}