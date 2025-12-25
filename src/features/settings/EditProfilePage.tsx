import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, Phone, Building } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface VendorProfile {
  id: string
  business_name: string
  owner_name: string
  mobile_number: string
  whatsapp_number: string
  business_type: string
  address: string
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<VendorProfile>({
    id: '',
    business_name: '',
    owner_name: '',
    mobile_number: '',
    whatsapp_number: '',
    business_type: 'tiffin',
    address: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (vendor) {
        setFormData({
          id: vendor.id,
          business_name: vendor.business_name || '',
          owner_name: vendor.owner_name || '',
          mobile_number: vendor.mobile_number || '',
          whatsapp_number: vendor.whatsapp_number || '',
          business_type: vendor.business_type || 'tiffin',
          address: vendor.address || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.business_name || !formData.owner_name || !formData.mobile_number) {
      alert('Please fill all required fields')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          mobile_number: formData.mobile_number,
          whatsapp_number: formData.whatsapp_number || formData.mobile_number,
          business_type: formData.business_type,
          address: formData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.id)

      if (error) throw error

      alert('Profile updated successfully!')
      navigate('/settings')
    } catch (error: any) {
      alert('Error updating profile: ' + error.message)
    } finally {
      setSaving(false)
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
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* Business Info Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-orange-500" />
              Business Information
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="e.g., Shree Tiffin Service"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'tiffin', label: 'Tiffin Service', emoji: '🍱' },
                  { value: 'mess', label: 'Mess / Canteen', emoji: '🍽️' }
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, business_type: type.value })}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      formData.business_type === type.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.emoji}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Business address"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Owner Info Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Owner Information
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" />
              Contact Information
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobile_number}
                onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input
                type="tel"
                value={formData.whatsapp_number}
                onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="Same as mobile if blank"
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}