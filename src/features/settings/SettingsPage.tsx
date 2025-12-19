import { useState, useEffect } from 'react'
import { User, Building2, Phone, LogOut, ChevronRight, Shield, Bell, HelpCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface VendorProfile {
  business_name: string
  owner_name: string
  mobile_number: string
  whatsapp_number: string
  business_type: string
  address: string
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || '')

      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (vendor) {
        setProfile(vendor)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const confirm = window.confirm('Are you sure you want to logout?')
    if (!confirm) return

    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to logout. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-500">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile?.owner_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">{profile?.owner_name || 'User'}</h2>
                <p className="text-orange-100 text-sm">{userEmail}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 py-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Business Name</p>
                <p className="font-medium text-gray-800">{profile?.business_name || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-t border-gray-100">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Mobile</p>
                <p className="font-medium text-gray-800">{profile?.mobile_number || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-t border-gray-100">
              <span className="text-lg">📍</span>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Business Type</p>
                <p className="font-medium text-gray-800 capitalize">{profile?.business_type || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          
          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Edit Profile</p>
              <p className="text-xs text-gray-400">Update your business details</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-t border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Notifications</p>
              <p className="text-xs text-gray-400">Manage notification preferences</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-t border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Privacy & Security</p>
              <p className="text-xs text-gray-400">Manage your data and security</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-t border-gray-100">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Help & Support</p>
              <p className="text-xs text-gray-400">Get help or contact us</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-red-200 text-red-500 font-semibold hover:bg-red-50 transition disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400">
          TiffinOS v1.0.0 • Made with ❤️ in Pune
        </p>

      </div>
    </div>
  )
}