import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, X, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Customer } from '../../types'

interface AttendanceRecord {
  customer_id: string
  status: 'present' | 'absent' | null
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [customers, setCustomers] = useState<Customer[]>([])
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
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
      setVendorId(vendor.id)

      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('full_name')

      setCustomers(customersData || [])

      // Fetch attendance for selected date
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('customer_id, meal_taken')
        .eq('vendor_id', vendor.id)
        .eq('attendance_date', dateStr)

      const attendanceMap = new Map<string, string>()
      attendanceData?.forEach(record => {
        attendanceMap.set(record.customer_id, record.meal_taken)
      })
      setAttendance(attendanceMap)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (customerId: string, status: 'present' | 'absent') => {
    if (!vendorId) return

    const currentStatus = attendance.get(customerId)
    const newStatus = currentStatus === status ? null : status

    // Optimistic update
    const newAttendance = new Map(attendance)
    if (newStatus) {
      newAttendance.set(customerId, newStatus)
    } else {
      newAttendance.delete(customerId)
    }
    setAttendance(newAttendance)

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]

      if (newStatus) {
        // Upsert attendance
        await supabase
          .from('attendance')
          .upsert({
            customer_id: customerId,
            vendor_id: vendorId,
            attendance_date: dateStr,
            meal_taken: newStatus,
            guest_count: 0
          }, {
            onConflict: 'customer_id,attendance_date'
          })
      } else {
        // Delete attendance
        await supabase
          .from('attendance')
          .delete()
          .eq('customer_id', customerId)
          .eq('attendance_date', dateStr)
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      // Revert on error
      fetchData()
    }
  }

  const markAllPresent = async () => {
    if (!vendorId || customers.length === 0) return
    setSaving(true)

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      const records = customers.map(customer => ({
        customer_id: customer.id,
        vendor_id: vendorId,
        attendance_date: dateStr,
        meal_taken: 'present',
        guest_count: 0
      }))

      await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'customer_id,attendance_date' })

      fetchData()
    } catch (error) {
      console.error('Error marking all present:', error)
    } finally {
      setSaving(false)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const presentCount = Array.from(attendance.values()).filter(s => s === 'present').length
  const absentCount = Array.from(attendance.values()).filter(s => s === 'absent').length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 mb-4">Attendance</h1>
        
        {/* Date Selector */}
        <div className="flex items-center justify-between bg-gray-100 rounded-xl p-2">
          <button
            onClick={() => changeDate(-1)}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <p className="font-semibold text-gray-900">{formatDate(selectedDate)}</p>
            {isToday && <p className="text-xs text-orange-500 font-medium">Today</p>}
          </div>
          
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-green-600 font-medium">Present</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-red-500 font-medium">Absent</p>
          </div>
          <div className="flex-1 bg-gray-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-600">{customers.length - presentCount - absentCount}</p>
            <p className="text-xs text-gray-500 font-medium">Unmarked</p>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      {customers.length > 0 && (
        <div className="px-5 py-3">
          <button
            onClick={markAllPresent}
            disabled={saving}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            {saving ? 'Marking...' : 'Mark All Present'}
          </button>
        </div>
      )}

      {/* Customer List */}
      <div className="px-5 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No customers yet</h3>
            <p className="text-gray-500">Add customers first to mark attendance</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((customer) => {
              const status = attendance.get(customer.id)
              
              return (
                <div
                  key={customer.id}
                  className={`bg-white p-4 rounded-xl border-2 transition-all ${
                    status === 'present' ? 'border-green-500 bg-green-50' :
                    status === 'absent' ? 'border-red-400 bg-red-50' :
                    'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      status === 'present' ? 'bg-green-500' :
                      status === 'absent' ? 'bg-red-400' :
                      'bg-gradient-to-br from-orange-400 to-amber-400'
                    }`}>
                      {status === 'present' ? <Check className="w-5 h-5" /> :
                       status === 'absent' ? <X className="w-5 h-5" /> :
                       customer.full_name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{customer.full_name}</h3>
                      <p className="text-sm text-gray-500">{customer.mobile_number}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => markAttendance(customer.id, 'present')}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          status === 'present'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-500'
                        }`}
                      >
                        <Check className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => markAttendance(customer.id, 'absent')}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          status === 'absent'
                            ? 'bg-red-400 text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-400'
                        }`}
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}