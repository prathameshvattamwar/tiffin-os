import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendor } from '../../context/VendorContext'
import { useMenuItems } from '../../hooks/useQueries'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Minus, Trash2, MessageCircle, ShoppingBag } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface MenuItem {
  id: string
  item_name: string
  category: string
  walk_in_price: number
}

interface CartItem {
  menu_item: MenuItem
  quantity: number
}

export default function QuickSalePage() {
  const navigate = useNavigate()
  const { vendor } = useVendor()
  const queryClient = useQueryClient()
  const { data: menuItems = [], isLoading: loading } = useMenuItems()
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [saving, setSaving] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')

  const vendorId = vendor?.id || null

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.menu_item.id === item.id)
    if (existing) {
      setCart(cart.map(c => 
        c.menu_item.id === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ))
    } else {
      setCart([...cart, { menu_item: item, quantity: 1 }])
    }
  }

  const updateQuantity = (itemId: string, change: number) => {
    setCart(cart.map(c => {
      if (c.menu_item.id === itemId) {
        const newQty = c.quantity + change
        return newQty > 0 ? { ...c, quantity: newQty } : c
      }
      return c
    }).filter(c => c.quantity > 0))
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.menu_item.id !== itemId))
  }

  const totalAmount = cart.reduce((sum, c) => sum + (c.menu_item.walk_in_price * c.quantity), 0)

  const handleSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart')
      return
    }

    if (!vendorId) return
    setSaving(true)

    try {
      // 1. Create walk-in customer if mobile provided
      let customerId = null
      
      if (customerMobile) {
        // Check if customer exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('vendor_id', vendorId)
          .eq('mobile_number', customerMobile)
          .single()

        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          // Create new walk-in customer
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              vendor_id: vendorId,
              full_name: customerName || 'Walk-in Customer',
              mobile_number: customerMobile,
              customer_type: 'walk_in',
              meal_type: 'both',
              is_active: true
            })
            .select()
            .single()
          
          customerId = newCustomer?.id
        }
      }

      // 2. Record payment
      await supabase
        .from('payments')
        .insert({
          customer_id: customerId,
          vendor_id: vendorId,
          amount: totalAmount,
          payment_type: 'walk_in',
          payment_mode: paymentMode,
          payment_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          notes: `Walk-in sale: ${cart.map(c => `${c.menu_item.item_name} x${c.quantity}`).join(', ')}`
        })

      // Reset form
      setCart([])
      setCustomerName('')
      setCustomerMobile('')
      
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      
      alert('Sale recorded successfully!')
      
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const sendWhatsAppReceipt = () => {
    if (!customerMobile) {
      alert('Please enter mobile number')
      return
    }

    const items = cart.map(c => `• ${c.menu_item.item_name} x${c.quantity} = ₹${c.menu_item.walk_in_price * c.quantity}`).join('\n')
    const msg = `
🧾 *Receipt*
━━━━━━━━━━━━━
${items}
━━━━━━━━━━━━━
*Total: ₹${totalAmount}*

Thank you! 🙏
    `.trim()

    window.open(`https://wa.me/91${customerMobile}?text=${encodeURIComponent(msg)}`, '_blank')
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

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Quick Sale</h1>
            <p className="text-sm text-gray-500">Walk-in customers</p>
          </div>
        </div>
      </div>

      {/* Customer Info (Optional) */}
      <div className="px-5 py-4 bg-white border-b border-gray-100">
        <p className="text-sm font-medium text-gray-500 mb-3">Customer (Optional)</p>
          <div className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="tel"
            placeholder="Mobile Number"
            value={customerMobile}
            onChange={e => setCustomerMobile(e.target.value)}
            maxLength={10}
            className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5 py-4">
        <p className="text-sm font-medium text-gray-500 mb-3">Menu Items</p>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No menu items</p>
            <button
              onClick={() => navigate('/settings/menu')}
              className="mt-3 text-orange-500 font-medium text-sm"
            >
              Add Menu Items →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map(item => {
              const inCart = cart.find(c => c.menu_item.id === item.id)
              
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`bg-white p-4 rounded-xl border-2 text-left transition ${
                    inCart ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                  }`}
                >
                  <div className="text-2xl mb-2">{getCategoryEmoji(item.category)}</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.item_name}</h3>
                  <p className="text-orange-600 font-bold">₹{item.walk_in_price}</p>
                  {inCart && (
                    <div className="mt-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full inline-block">
                      x{inCart.quantity}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          {/* Cart Items */}
          <div className="px-5 py-3 max-h-40 overflow-y-auto">
            {cart.map(item => (
              <div key={item.menu_item.id} className="flex items-center gap-3 py-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{item.menu_item.item_name}</p>
                  <p className="text-xs text-gray-500">₹{item.menu_item.walk_in_price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.menu_item.id, -1)}
                    className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menu_item.id, 1)}
                    className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.menu_item.id)}
                    className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Mode */}
          <div className="px-5 py-2 border-t border-gray-100">
            <div className="flex gap-2">
              {['cash', 'upi', 'card'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                    paymentMode === mode
                      ? 'bg-orange-100 text-orange-600 border-2 border-orange-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Total & Actions */}
          <div className="px-5 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-gray-900">₹{totalAmount}</span>
            </div>
            <div className="flex gap-3">
              {customerMobile && (
                <button
                  onClick={sendWhatsAppReceipt}
                  className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleSale}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {saving ? 'Processing...' : `Complete Sale • ₹${totalAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}