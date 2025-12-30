import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Vendor {
  id: string
  auth_user_id: string
  business_name: string
  owner_name: string
  mobile_number: string
  address: string
  is_onboarded: boolean
}

interface VendorContextType {
  vendor: Vendor | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const VendorContext = createContext<VendorContextType | undefined>(undefined)

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVendor = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setVendor(null)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('vendors')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (fetchError) throw fetchError
      setVendor(data)
    } catch (err: any) {
      setError(err.message)
      setVendor(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendor()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchVendor()
      } else if (event === 'SIGNED_OUT') {
        setVendor(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <VendorContext.Provider value={{ vendor, loading, error, refetch: fetchVendor }}>
      {children}
    </VendorContext.Provider>
  )
}

export function useVendor() {
  const context = useContext(VendorContext)
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider')
  }
  return context
}