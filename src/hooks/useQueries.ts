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

// ============ CUSTOMER DETAIL ============
export function useCustomerDetail(customerId: string | undefined) {
  const { vendor } = useVendor()

  return useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: async () => {
      if (!customerId || !vendor) return null

      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (customerError) throw customerError

      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .single()

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('customer_id', customerId)

      const totalPaid = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const planAmount = subscriptionData?.plan_amount || 0

      // Fetch attendance count
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .or('lunch_taken.eq.true,dinner_taken.eq.true')

      // Calculate guest charges
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('guest_count')
        .eq('customer_id', customerId)

      const totalGuests = attendanceData?.reduce((sum, a) => sum + (a.guest_count || 0), 0) || 0

      // Fetch menu prices
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('item_name, monthly_price')
        .eq('vendor_id', customerData.vendor_id)
        .eq('is_default', true)

      const halfThali = menuData?.find(m => m.item_name === 'Half Thali')
      const fullThali = menuData?.find(m => m.item_name === 'Full Thali')
      const halfPrice = halfThali?.monthly_price || 50
      const fullPrice = fullThali?.monthly_price || 70

      // Guest charges based on menu price
      const lunchPrice = customerData.lunch_meal_type === 'full_thali' ? fullPrice : halfPrice
      const dinnerPrice = customerData.dinner_meal_type === 'full_thali' ? fullPrice : halfPrice
      const avgMealPrice = Math.round((lunchPrice + dinnerPrice) / 2)
      const guestCharges = totalGuests * avgMealPrice

      const pendingAmount = planAmount + guestCharges - totalPaid

      return {
        ...customerData,
        subscription: subscriptionData,
        total_paid: totalPaid,
        pending_amount: pendingAmount,
        attendance_count: attendanceCount || 0,
        guest_charges: guestCharges,
        total_guests: totalGuests
      }
    },
    enabled: !!customerId && !!vendor,
    staleTime: 1000 * 60 * 2, // 2 min cache
  })
}

// ============ CUSTOMER REPORT ============
export function useCustomerReport(customerId: string | undefined) {
  const { vendor } = useVendor()

  return useQuery({
    queryKey: ['customer-report', customerId],
    queryFn: async () => {
      if (!customerId || !vendor) return null

      // Fetch menu prices
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('item_name, monthly_price')
        .eq('vendor_id', vendor.id)
        .eq('is_default', true)

      const halfThali = menuData?.find(m => m.item_name === 'Half Thali')
      const fullThali = menuData?.find(m => m.item_name === 'Full Thali')
      const menuPrices = {
        half_thali: halfThali?.monthly_price || 50,
        full_thali: fullThali?.monthly_price || 70
      }

      // Fetch customer
      const { data: customer } = await supabase
        .from('customers')
        .select('full_name, mobile_number, whatsapp_number, meal_type, lunch_meal_type, dinner_meal_type')
        .eq('id', customerId)
        .single()

      // Fetch subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('start_date, end_date, meal_frequency, plan_amount')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .single()

      // Fetch attendance stats
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('attendance_date, lunch_taken, dinner_taken, guest_count, guest_lunch_count, guest_dinner_count')
        .eq('customer_id', customerId)

      // Calculate attendance metrics
      const daysPresent = new Set(
        attendanceData?.filter(a => a.lunch_taken || a.dinner_taken).map(a => a.attendance_date)
      ).size
      const lunchCount = attendanceData?.filter(a => a.lunch_taken).length || 0
      const dinnerCount = attendanceData?.filter(a => a.dinner_taken).length || 0
      const totalMeals = lunchCount + dinnerCount
      const guestCount = attendanceData?.reduce((sum, a) => sum + (a.guest_count || 0), 0) || 0
      const guestLunchCount = attendanceData?.reduce((sum, a) => sum + (a.guest_lunch_count || 0), 0) || 0
      const guestDinnerCount = attendanceData?.reduce((sum, a) => sum + (a.guest_dinner_count || 0), 0) || 0

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_mode')
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false })

      const totalPaid = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      return {
        menuPrices,
        customer: customer!,
        vendor: { business_name: vendor.business_name, mobile_number: (vendor as any).mobile_number || '' },
        subscription,
        attendance: {
          daysPresent,
          lunchCount,
          dinnerCount,
          totalMeals,
          guestCount,
          guestLunchCount,
          guestDinnerCount
        },
        payments: {
          total_paid: totalPaid,
          history: paymentsData || []
        }
      }
    },
    enabled: !!customerId && !!vendor,
    staleTime: 1000 * 60 * 2, // 2 min cache
  })
}

// ============ MENU ITEMS (for Quick Sale) ============
export function useMenuItems() {
  const { vendor } = useVendor()

  return useQuery({
    queryKey: ['menu-items', vendor?.id],
    queryFn: async () => {
      if (!vendor) return []

      const { data } = await supabase
        .from('menu_items')
        .select('id, item_name, category, walk_in_price')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('category')

      return data || []
    },
    enabled: !!vendor,
    staleTime: 1000 * 60 * 10, // 10 min cache
  })
}