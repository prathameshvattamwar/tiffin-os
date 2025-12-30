import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, UtensilsCrossed, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface MenuItem {
  id: string
  item_name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  walk_in_price: number
  monthly_price: number
  description: string
  is_active: boolean
  is_default: boolean
}

export default function MenuManagementPage() {
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)

  // Separate default and custom items
  const defaultItems = menuItems.filter(item => item.is_default)
  const customItems = menuItems.filter(item => !item.is_default)

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
        .order('is_default', { ascending: false })
        .order('item_name', { ascending: true })

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
    // For default items, only price is required
    if (editingItem?.is_default) {
      if (!formData.monthly_price) {
        alert('Please enter price')
        return
      }
    } else {
      if (!formData.item_name || !formData.monthly_price) {
        alert('Please fill Item Name and Price')
        return
      }
    }

    if (!vendorId) return

    try {
      if (editingItem) {
        // Update existing item
        const updateData: any = {
          walk_in_price: Number(formData.monthly_price), // Same price for both
          monthly_price: Number(formData.monthly_price)
        }
        
        // Only update name/category/description for custom items
        if (!editingItem.is_default) {
          updateData.item_name = formData.item_name
          updateData.category = formData.category
          updateData.description = formData.description
        }

        await supabase
          .from('menu_items')
          .update(updateData)
          .eq('id', editingItem.id)
      } else {
        // Insert new custom item
        await supabase
          .from('menu_items')
          .insert({
            vendor_id: vendorId,
            item_name: formData.item_name,
            category: formData.category,
            walk_in_price: Number(formData.monthly_price),
            monthly_price: Number(formData.monthly_price),
            description: formData.description,
            is_active: true,
            is_default: false
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
      <div className="px-5 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Default Items Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Default Items</h2>
              </div>
              <div className="space-y-3">
                {defaultItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                        🍽️
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-200 text-orange-700">
                            Default
                          </span>
                        </div>
                        <p className="text-lg font-bold text-orange-600 mt-1">₹{item.monthly_price}</p>
                      </div>
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-4 py-2 bg-white rounded-lg border border-orange-200 text-orange-600 text-sm font-medium hover:bg-orange-50"
                      >
                        Edit Price
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Items Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Custom Items</h2>
              </div>
              
              {customItems.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 mb-3">No custom items yet</p>
                  <button
                    onClick={openAddModal}
                    className="text-orange-500 font-medium hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {customItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                          🍴
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                          <p className="text-lg font-bold text-gray-800 mt-1">₹{item.monthly_price}</p>
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
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem 
                  ? editingItem.is_default 
                    ? `Edit ${editingItem.item_name} Price`
                    : 'Edit Menu Item'
                  : 'Add Menu Item'}
              </h2>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Only show name/category for custom items */}
              {(!editingItem || !editingItem.is_default) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      value={formData.item_name}
                      onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                      placeholder="e.g., Extra Roti, Salad"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
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
                </>
              )}

              {/* Price - always visible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={formData.monthly_price}
                    onChange={e => setFormData({ ...formData, monthly_price: e.target.value })}
                    placeholder="50"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
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