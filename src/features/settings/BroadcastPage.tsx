import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Users, MessageCircle, Bell, UtensilsCrossed } from 'lucide-react'
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
    template: `🍽️ *Today's Menu*\n\n🌅 Lunch:\n• [Item 1]\n• [Item 2]\n\n🌙 Dinner:\n• [Item 1]\n• [Item 2]\n\n- {business_name}`
  },
  {
    id: 'holiday',
    title: 'Holiday Notice',
    icon: '🏖️',
    template: `📢 *Notice*\n\nDear Customer,\n\nOur mess/tiffin service will be closed on [DATE] due to [REASON].\n\nRegular service will resume from [DATE].\n\nSorry for inconvenience.\n\n- {business_name}`
  },
  {
    id: 'reminder',
    title: 'Payment Reminder',
    icon: '💰',
    template: `🙏 *Gentle Reminder*\n\nDear Customer,\n\nKindly clear your pending payment at your earliest convenience.\n\nThank you!\n\n- {business_name}`
  },
  {
    id: 'custom',
    title: 'Custom Message',
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
  const [sent, setSent] = useState(0)

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
      // Select all by default
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

  const selectAll = () => {
    setSelectedCustomers(new Set(customers.map(c => c.id)))
  }

  const deselectAll = () => {
    setSelectedCustomers(new Set())
  }

  const sendBroadcast = async () => {
    if (!message.trim()) {
      alert('Please enter a message')
      return
    }
    if (selectedCustomers.size === 0) {
      alert('Please select at least one customer')
      return
    }

    setSending(true)
    setSent(0)

    const selectedList = customers.filter(c => selectedCustomers.has(c.id))
    
    for (let i = 0; i < selectedList.length; i++) {
      const customer = selectedList[i]
      const phone = customer.whatsapp_number || customer.mobile_number
      const encodedMsg = encodeURIComponent(message)
      
      // Open WhatsApp for each customer with 1 second delay
      setTimeout(() => {
        window.open(`https://wa.me/91${phone}?text=${encodedMsg}`, '_blank')
        setSent(prev => prev + 1)
      }, i * 1000)
    }

    setTimeout(() => {
      setSending(false)
      alert(`✅ Opened WhatsApp for ${selectedList.length} customers!`)
    }, selectedList.length * 1000 + 500)
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
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Broadcast Message</h1>
            <p className="text-sm text-gray-500">Send message to all customers</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Template Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Choose Template</h3>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  selectedTemplate === template.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">{template.icon}</div>
                <div className="text-sm font-medium">{template.title}</div>
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
            placeholder="Type your message here..."
            rows={6}
            className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            {message.length} characters
          </p>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Select Customers ({selectedCustomers.size}/{customers.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-orange-600 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={deselectAll}
                className="text-xs text-gray-500 font-medium"
              >
                Deselect
              </button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {customers.map(customer => (
              <label
                key={customer.id}
                className="flex items-center gap-3 p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCustomers.has(customer.id)}
                  onChange={() => toggleCustomer(customer.id)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{customer.full_name}</p>
                  <p className="text-xs text-gray-500">{customer.mobile_number}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={sendBroadcast}
          disabled={sending || selectedCustomers.size === 0 || !message.trim()}
          className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {sending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending... ({sent}/{selectedCustomers.size})
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send to {selectedCustomers.size} Customers
            </>
          )}
        </button>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center">
          WhatsApp will open for each customer. You'll need to tap send manually.
        </p>

      </div>
    </div>
  )
}