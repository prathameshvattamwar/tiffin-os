import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Users, Check, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Customer {
  id: string
  full_name: string
  mobile_number: string
  whatsapp_number: string
}

const TEMPLATES = [
  {
    id: 'menu',
    title: "Today's Menu",
    icon: '🍽️',
    template: `🍽️ *आजचा मेनू*\n\n🌅 Lunch: [Item]\n🌙 Dinner: [Item]\n\n- {business_name}`
  },
  {
    id: 'holiday',
    title: 'Holiday Notice',
    icon: '🏖️',
    template: `📢 *सूचना*\n\n[DATE] रोजी आमची सेवा बंद राहील.\n\n- {business_name}`
  },
  {
    id: 'reminder',
    title: 'Payment Reminder',
    icon: '💰',
    template: `🙏 *Payment Reminder*\n\nकृपया बाकी रक्कम भरा.\n\n- {business_name}`
  },
  {
    id: 'custom',
    title: 'Custom',
    icon: '✏️',
    template: ''
  }
]

export default function BroadcastPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [message, setMessage] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [sending, setSending] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sentCount, setSentCount] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, business_name')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return
      setBusinessName(vendor.business_name || 'TiffinOS')

      const { data: customersData } = await supabase
        .from('customers')
        .select('id, full_name, mobile_number, whatsapp_number')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('full_name')

      setCustomers(customersData || [])
      setSelectedCustomers(new Set(customersData?.map(c => c.id) || []))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setMessage(template.template.replace('{business_name}', businessName))
    }
  }

  const toggleCustomer = (customerId: string) => {
    const newSet = new Set(selectedCustomers)
    if (newSet.has(customerId)) {
      newSet.delete(customerId)
    } else {
      newSet.add(customerId)
    }
    setSelectedCustomers(newSet)
  }

  const selectAll = () => setSelectedCustomers(new Set(customers.map(c => c.id)))
  const deselectAll = () => setSelectedCustomers(new Set())

  // 🚀 ONE CLICK SEND - Opens WhatsApp for each customer sequentially
  const startBroadcast = async () => {
    if (!message.trim()) {
      alert('Please enter a message')
      return
    }
    if (selectedCustomers.size === 0) {
      alert('Please select at least one customer')
      return
    }

    const confirmed = window.confirm(
      `📤 Send message to ${selectedCustomers.size} customers?\n\nWhatsApp will open for each customer. Tap "Send" in WhatsApp, then come back here and click "Next Customer".`
    )
    if (!confirmed) return

    setSending(true)
    setCurrentIndex(0)
    setSentCount(0)

    const selectedList = customers.filter(c => selectedCustomers.has(c.id))
    
    // Open first customer
    openWhatsAppForCustomer(selectedList[0], 0, selectedList.length)
  }

// const [currentCustomerList, setCurrentCustomerList] = useState<any[]>([])

const openWhatsAppForCustomer = (customer: Customer, index: number, total: number) => {
  const phone = customer.whatsapp_number || customer.mobile_number
  const personalizedMsg = message.replace('{customer_name}', customer.full_name)
  const encodedMsg = encodeURIComponent(personalizedMsg)
  
  setCurrentIndex(index + 1)
  setSentCount(index + 1)
  
  window.open(`https://wa.me/91${phone}?text=${encodedMsg}`, '_blank')
  
  if (index + 1 >= total) {
    setSending(false)
    alert(`✅ Completed! Opened WhatsApp for ${total} customers.`)
  }
}

const sendNextCustomer = () => {
  const selectedList = customers.filter(c => selectedCustomers.has(c.id))
  if (currentIndex < selectedList.length) {
    openWhatsAppForCustomer(selectedList[currentIndex], currentIndex, selectedList.length)
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
    <div className="min-h-screen bg-gray-50 pb-8">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/settings')} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Broadcast Message</h1>
            <p className="text-sm text-gray-500">Send to all customers at once</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Template Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Choose Template</h3>
          <div className="grid grid-cols-4 gap-2">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  selectedTemplate === template.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">{template.icon}</div>
                <div className="text-xs font-medium">{template.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={5}
            className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            Tip: Use {'{customer_name}'} to add customer's name
          </p>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Select Customers ({selectedCustomers.size}/{customers.length})
            </h3>
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-xs text-orange-600 font-semibold">All</button>
              <button onClick={deselectAll} className="text-xs text-gray-500 font-semibold">None</button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {customers.map(customer => (
              <label key={customer.id} className="flex items-center gap-3 p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedCustomers.has(customer.id)}
                  onChange={() => toggleCustomer(customer.id)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{customer.full_name}</p>
                  <p className="text-xs text-gray-500">{customer.whatsapp_number || customer.mobile_number}</p>
                </div>
                {selectedCustomers.has(customer.id) && <Check className="w-5 h-5 text-orange-500" />}
              </label>
            ))}
          </div>
        </div>

        {/* Progress (when sending) */}
        {/* {sending && (
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="font-semibold text-orange-800">Sending Messages...</p>
                <p className="text-sm text-orange-600">{currentIndex} of {selectedCustomers.size} completed</p>
              </div>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2 mb-3">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${(currentIndex / selectedCustomers.size) * 100}%` }}
              ></div>
            </div>
            {currentIndex < selectedCustomers.size && (
              <button
                onClick={sendNextCustomer}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Open Next Customer ({currentIndex + 1}/{selectedCustomers.size})
              </button>
            )}
            {currentIndex >= selectedCustomers.size && (
              <div className="text-center py-2">
                <p className="text-green-600 font-semibold">✅ All Done!</p>
              </div>
            )}
          </div>
        )} */}

        {/* Send Button - Coming Soon */}
        <button
          disabled={true}
          className="w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          🚧 Feature Coming Soon
        </button>

        {/* Info Note */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-700">
            💡 <strong>How it works:</strong> WhatsApp will open for each customer. Just tap "Send" each time. Takes ~2 seconds per customer.
          </p>
        </div>

      </div>
    </div>
  )
}