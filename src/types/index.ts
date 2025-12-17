// Vendor Types
export interface Vendor {
  id: string
  auth_user_id: string
  business_name: string
  owner_name: string
  mobile_number: string
  whatsapp_number?: string
  business_type: 'tiffin' | 'mess' | 'both'
  address?: string
  created_at: string
}

// Customer Types
export interface Customer {
  id: string
  vendor_id: string
  full_name: string
  mobile_number: string
  whatsapp_number?: string
  customer_type: 'monthly' | 'walk_in'
  address?: string
  notes?: string
  is_active: boolean
  created_at: string
}

// Subscription Types
export interface Subscription {
  id: string
  customer_id: string
  vendor_id: string
  start_date: string
  end_date: string
  meal_frequency: 'one_time' | 'two_times'
  plan_amount: number
  status: 'active' | 'expired' | 'cancelled'
}

// Attendance Types
export interface Attendance {
  id: string
  customer_id: string
  subscription_id: string
  vendor_id: string
  attendance_date: string
  meal_taken: 'present' | 'absent' | 'cancelled'
  guest_count: number
  notes?: string
}

// Payment Types
export interface Payment {
  id: string
  customer_id: string
  subscription_id: string
  vendor_id: string
  amount: number
  payment_type: 'advance' | 'partial' | 'full'
  payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer'
  payment_date: string
  status: 'completed' | 'pending' | 'failed'
}