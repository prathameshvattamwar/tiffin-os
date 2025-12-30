import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useVendor } from '../context/VendorContext'

// ============ CUSTOMERS ============
export function useCustomers() {
  const { vendor } = useVendor()

  return useQuery({
    queryKey: ['customers', vendor?.id],
    queryFn: async () => {
      if (!vendor) return []

      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('vendor_id', vendor.id)

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('customer_id, amount')
        .eq('vendor_id', vendor.id)

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('customer_id, guest_count')
        .eq('vendor_id', vendor.id)

      return (customersData || []).map(customer => {
        const customerSubs = subscriptionsData?.filter(s => s.customer_id === customer.id) || []
        const activeSub = customerSubs.find(s => s.status === 'active')
        const latestSub = activeSub || customerSubs.sort((a, b) =>
          new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
        )[0]

        const customerPayments = paymentsData?.filter(p => p.customer_id === customer.id) || []
        const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0)

        const customerAttendance = attendanceData?.filter(a => a.customer_id === customer.id) || []
        const totalGuests = customerAttendance.reduce((sum, a) => sum + (a.guest_count || 0), 0)
        const guestCharges = totalGuests * 40

        const planAmount = latestSub?.plan_amount || 0
        const pendingAmount = Math.max(0, planAmount + guestCharges - totalPaid)

        return {
          ...customer,
          subscription: latestSub,
          pending_amount: pendingAmount,
          total_paid: totalPaid,
          guest_charges: guestCharges
        }
      })
    },
    enabled: !!vendor,
    staleTime: 1000 * 60 * 5, // 5 min cache
  })
}

// ============ DASHBOARD STATS ============
export function useDashboardStats() {
  const { vendor } = useVendor()

  return useQuery({
    queryKey: ['dashboard-stats', vendor?.id],
    queryFn: async () => {
      if (!vendor) return null

      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, customer_id, plan_amount, end_date, status')
        .eq('vendor_id', vendor.id)
        .eq('status', 'active')

      const { data: payments } = await supabase
        .from('payments')
        .select('customer_id, amount, payment_date')
        .eq('vendor_id', vendor.id)

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('customer_id, guest_count, lunch_taken, dinner_taken, attendance_date')
        .eq('vendor_id', vendor.id)

      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      let totalPending = 0
      let expiringCount = 0

      subscriptions?.forEach(sub => {
        const customerPayments = payments?.filter(p => p.customer_id === sub.customer_id) || []
        const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0)

        const customerAttendance = attendanceData?.filter(a => a.customer_id === sub.customer_id) || []
        const totalGuests = customerAttendance.reduce((sum, a) => sum + (a.guest_count || 0), 0)
        const guestCharges = totalGuests * 40

        const pending = Math.max(0, Number(sub.plan_amount) + guestCharges - totalPaid)
        totalPending += pending

        const endDate = new Date(sub.end_date)
        if (endDate <= sevenDaysLater && endDate >= today) {
          expiringCount++
        }
      })

      const todayAttendance = attendanceData?.filter(a => a.attendance_date === todayStr) || []
      let todayMeals = 0
      todayAttendance.forEach(a => {
        if (a.lunch_taken) todayMeals++
        if (a.dinner_taken) todayMeals++
      })

      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const thisMonthPayments = payments?.filter(p => p.payment_date >= firstOfMonth) || []
      const thisMonthCollection = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

      return {
        totalCustomers: customerCount || 0,
        totalPending,
        todayMeals,
        thisMonthCollection,
        expiringCount
      }
    },
    enabled: !!vendor,
    staleTime: 1000 * 60 * 2, // 2 min cache
  })
}

// ============ MENU PRICES ============
export function useMenuPrices() {
  const { vendor } = useVendor()

  return useQuery({
    queryKey: ['menu-prices', vendor?.id],
    queryFn: async () => {
      if (!vendor) return { half_thali: 50, full_thali: 70 }

      const { data } = await supabase
        .from('menu_items')
        .select('item_name, monthly_price')
        .eq('vendor_id', vendor.id)
        .eq('is_default', true)

      const halfThali = data?.find(m => m.item_name === 'Half Thali')
      const fullThali = data?.find(m => m.item_name === 'Full Thali')

      return {
        half_thali: halfThali?.monthly_price || 50,
        full_thali: fullThali?.monthly_price || 70
      }
    },
    enabled: !!vendor,
    staleTime: 1000 * 60 * 10, // 10 min cache
  })
}

// ============ ATTENDANCE (QUICK MODE) ============
export function useQuickAttendance(selectedDate: Date) {
  const { vendor } = useVendor()
  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

  return useQuery({
    queryKey: ['quick-attendance', vendor?.id, dateStr],
    queryFn: async () => {
      if (!vendor) return { customers: [], attendance: new Map() }

      // Fetch customers with subscriptions
      const { data: customersData } = await supabase
        .from('customers')
        .select(`*, subscriptions(id, start_date, end_date, meal_frequency, status)`)
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('full_name')

      // Filter customers with valid subscription for this date
      const filteredCustomers = (customersData || [])
        .map((c: any) => {
          const activeSub = c.subscriptions?.find((s: any) =>
            s.status === 'active' &&
            s.start_date <= dateStr &&
            s.end_date >= dateStr
          )
          return { ...c, subscription: activeSub || null }
        })
        .filter((c: any) => c.subscription !== null)

      // Fetch attendance for this date
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('customer_id, lunch_taken, dinner_taken, guest_count, guest_lunch_count, guest_dinner_count')
        .eq('vendor_id', vendor.id)
        .eq('attendance_date', dateStr)

      const attendanceMap = new Map()
      attendanceData?.forEach(record => {
        attendanceMap.set(record.customer_id, {
          lunch: record.lunch_taken || false,
          dinner: record.dinner_taken || false,
          guestLunch: record.guest_lunch_count || 0,
          guestDinner: record.guest_dinner_count || 0
        })
      })

      return { customers: filteredCustomers, attendance: attendanceMap }
    },
    enabled: !!vendor,
    staleTime: 1000 * 60 * 1, // 1 min cache
  })
}

// ============ PAYMENTS ============
export function usePayments() {
  const { vendor } = useVendor()

  return useQuery({
    queryKey: ['payments', vendor?.id],
    queryFn: async () => {
      if (!vendor) return { pending: [], history: [] }

      const { data: customersData } = await supabase
        .from('customers')
        .select(`
          id, full_name, mobile_number, whatsapp_number,
          subscriptions(id, plan_amount, start_date, end_date, status, billing_type)
        `)
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('payment_date', { ascending: false })

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('customer_id, guest_lunch_count, guest_dinner_count')
        .eq('vendor_id', vendor.id)

      // Process pending payments
      const pending: any[] = []
      customersData?.forEach((customer: any) => {
        const activeSub = customer.subscriptions?.find((s: any) => s.status === 'active')
        if (!activeSub) return

        const customerPayments = paymentsData?.filter(p => p.customer_id === customer.id) || []
        const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0)

        const customerAttendance = attendanceData?.filter(a => a.customer_id === customer.id) || []
        const guestLunch = customerAttendance.reduce((sum, a) => sum + (a.guest_lunch_count || 0), 0)
        const guestDinner = customerAttendance.reduce((sum, a) => sum + (a.guest_dinner_count || 0), 0)
        const guestCharges = (guestLunch + guestDinner) * 50 // Default price

        const totalDue = Number(activeSub.plan_amount) + guestCharges
        const pendingAmount = totalDue - totalPaid

        if (pendingAmount > 0) {
          pending.push({
            ...customer,
            subscription: activeSub,
            total_due: totalDue,
            total_paid: totalPaid,
            pending_amount: pendingAmount,
            guest_charges: guestCharges
          })
        }
      })

      return {
        pending: pending.sort((a, b) => b.pending_amount - a.pending_amount),
        history: paymentsData || []
      }
    },
    enabled: !!vendor,
    staleTime: 1000 * 60 * 2, // 2 min cache
  })
}