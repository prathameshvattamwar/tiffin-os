import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../lib/language'
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, UtensilsCrossed, CreditCard, FileSpreadsheet, Trash2, Globe, Check, BookOpen } from 'lucide-react'

interface VendorProfile {
  id: string
  business_name: string
  owner_name: string
  mobile_number: string
  email?: string
  business_type: string
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [notifications, setNotifications] = useState({
    payment_reminders: true,
    expiry_alerts: true,
    daily_summary: false
  })
  const { language, setLanguage, t } = useLanguage()
  const [showLanguageModal, setShowLanguageModal] = useState(false)

  useEffect(() => {
    fetchVendor()
    loadNotificationSettings()
  }, [])

  const fetchVendor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (data) {
        setVendor({ ...data, email: user.email })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationSettings = () => {
    const saved = localStorage.getItem('tiffinos_notifications')
    if (saved) {
      setNotifications(JSON.parse(saved))
    }
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    localStorage.setItem('tiffinos_notifications', JSON.stringify(updated))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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

      <div className="px-5 py-4 space-y-4">

        {/* Profile Card */}
        <div 
          onClick={() => navigate('/settings/profile')}
          className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {vendor?.owner_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{vendor?.owner_name || 'User'}</h2>
              <p className="text-white/80 text-sm">{vendor?.business_name}</p>
              <p className="text-white/60 text-xs mt-1">{vendor?.email}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60" />
          </div>
        </div>

        {/* Business Options */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <p className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase bg-gray-50">Business</p>
          
          <button 
            onClick={() => navigate('/settings/profile')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-b border-gray-100"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Edit Profile</p>
              <p className="text-xs text-gray-500">Business info, contact details</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          {/* Menu Management */}
          <button 
            onClick={() => navigate('/settings/menu')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-b border-gray-100"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Menu Management</p>
              <p className="text-xs text-gray-500">Add, edit menu items & prices</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-b border-gray-100"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Business Reports</p>
              <p className="text-xs text-gray-500">Download Excel reports</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => navigate('/settings/subscription')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition"
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Subscription</p>
              <p className="text-xs text-gray-500">Manage your TiffinOS plan</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          {/* Recycle Bin */}
            <button 
              onClick={() => navigate('/settings/recycle-bin')}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Recycle Bin</p>
                <p className="text-xs text-gray-500">Restore deleted customers</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => setShowLanguageModal(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">{t('settings.language')}</p>
              <p className="text-xs text-gray-500">{t('settings.languageDesc')}</p>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full capitalize">
              {language}
            </span>
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <p className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase bg-gray-50">Notifications</p>
          
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment Reminders</p>
                  <p className="text-xs text-gray-500">Get notified for pending payments</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification('payment_reminders')}
                className={`w-12 h-7 rounded-full transition-colors ${
                  notifications.payment_reminders ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  notifications.payment_reminders ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Expiry Alerts</p>
                  <p className="text-xs text-gray-500">Subscription expiry notifications</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification('expiry_alerts')}
                className={`w-12 h-7 rounded-full transition-colors ${
                  notifications.expiry_alerts ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  notifications.expiry_alerts ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Daily Summary</p>
                  <p className="text-xs text-gray-500">End of day reports</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification('daily_summary')}
                className={`w-12 h-7 rounded-full transition-colors ${
                  notifications.daily_summary ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  notifications.daily_summary ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Other Options Help & Support*/}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <p className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase bg-gray-50">Support</p>

          <button 
          onClick={() => navigate('/settings/how-to-use')}
          className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-b border-gray-100"
        >
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900">How to Use</p>
            <p className="text-xs text-gray-500">Learn to use TiffinOS / कसे वापरायचे</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>
          
          <button 
            onClick={() => window.open('https://wa.me/919271981229?text=Hi, I need help with TiffinOS', '_blank')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition border-b border-gray-100"
          >
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Help & Support</p>
              <p className="text-xs text-gray-500">Contact us on WhatsApp</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => navigate('/settings/privacy')}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Privacy & Security</p>
              <p className="text-xs text-gray-500">Data protection info</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:bg-red-50 transition"
        >
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <p className="font-medium text-red-600">Logout</p>
        </button>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400 pt-4">
          TiffinOS v1.0.0 • Made with ❤️ in Pune
        </p>

      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Logout?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to logout from TiffinOS?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setShowLanguageModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Select Language</h3>
              <p className="text-sm text-gray-500">भाषा चुनें</p>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => { setLanguage('english'); setShowLanguageModal(false) }}
                className={`w-full p-4 rounded-xl border-2 text-left transition ${
                  language === 'english' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">English</p>
                    <p className="text-sm text-gray-500">Full English</p>
                  </div>
                  {language === 'english' && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => { setLanguage('hinglish'); setShowLanguageModal(false) }}
                className={`w-full p-4 rounded-xl border-2 text-left transition ${
                  language === 'hinglish' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Hinglish</p>
                    <p className="text-sm text-gray-500">Hindi + English Mix</p>
                  </div>
                  {language === 'hinglish' && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}