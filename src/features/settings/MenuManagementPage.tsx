import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, UtensilsCrossed } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface MenuItem {
  id: string
  item_name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  walk_in_price: number
  monthly_price: number
  description: string
  is_active: boolean
}

export default function MenuManagementPage() {
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'lunch' as MenuItem['category'],
    walk_in_price: '',
    monthly_price: '',
    description: ''
  })

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
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

      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('category', { ascending: true })

      setMenuItems(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingItem(null)
    setFormData({
      item_name: '',
      category: 'lunch',
      walk_in_price: '',
      monthly_price: '',
      description: ''
    })
    setShowModal(true)
  }

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      item_name: item.item_name,
      category: item.category,
      walk_in_price: item.walk_in_price.toString(),
      monthly_price: item.monthly_price.toString(),
      description: item.description || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.item_name || !formData.walk_in_price || !formData.monthly_price) {
      alert('Please fill all required fields')
      return
    }

    if (!vendorId) return

    try {
      if (editingItem) {
        await supabase
          .from('menu_items')
          .update({
            item_name: formData.item_name,
            category: formData.category,
            walk_in_price: Number(formData.walk_in_price),
            monthly_price: Number(formData.monthly_price),
            description: formData.description
          })
          .eq('id', editingItem.id)
      } else {
        await supabase
          .from('menu_items')
          .insert({
            vendor_id: vendorId,
            item_name: formData.item_name,
            category: formData.category,
            walk_in_price: Number(formData.walk_in_price),
            monthly_price: Number(formData.monthly_price),
            description: formData.description,
            is_active: true
          })
      }

      setShowModal(false)
      fetchMenuItems()
    } catch (error: any) {
      alert('Error saving: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return

    await supabase
      .from('menu_items')
      .update({ is_active: false })
      .eq('id', id)

    fetchMenuItems()
  }

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'breakfast': return '🌅'
      case 'lunch': return '☀️'
      case 'dinner': return '🌙'
      case 'snack': return '🍿'
      default: return '🍽️'
    }
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-700'
      case 'lunch': return 'bg-orange-100 text-orange-700'
      case 'dinner': return 'bg-purple-100 text-purple-700'
      case 'snack': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
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
            <h1 className="text-lg font-bold text-gray-900">Menu Management</h1>
            <p className="text-sm text-gray-500">{menuItems.length} items</p>
          </div>
          <button
            onClick={openAddModal}
            className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No menu items</h3>
            <p className="text-gray-500 mb-4">Add your first menu item</p>
            <button
              onClick={openAddModal}
              className="bg-orange-500 text-white px-6 py-2 rounded-xl font-medium"
            >
              Add Menu Item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {menuItems.map(item => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                    {getCategoryEmoji(item.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">
                        Walk-in: <span className="font-semibold text-gray-900">₹{item.walk_in_price}</span>
                      </span>
                      <span className="text-gray-600">
                        Monthly: <span className="font-semibold text-green-600">₹{item.monthly_price}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="e.g., Chapati Bhaji"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
                    { value: 'lunch', label: 'Lunch', emoji: '☀️' },
                    { value: 'dinner', label: 'Dinner', emoji: '🌙' },
                    { value: 'snack', label: 'Snack', emoji: '🍿' }
                  ].map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value as MenuItem['category'] })}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        formData.category === cat.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{cat.emoji}</div>
                      <div className="text-xs font-medium">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Walk-in Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      value={formData.walk_in_price}
                      onChange={e => setFormData({ ...formData, walk_in_price: e.target.value })}
                      placeholder="80"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      value={formData.monthly_price}
                      onChange={e => setFormData({ ...formData, monthly_price: e.target.value })}
                      placeholder="60"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold"
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}