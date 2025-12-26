import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, RotateCcw, User, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface DeletedCustomer {
  id: string
  full_name: string
  mobile_number: string
  deleted_at: string
}

export default function RecycleBinPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [deletedCustomers, setDeletedCustomers] = useState<DeletedCustomer[]>([])
  const [restoring, setRestoring] = useState<string | null>(null)
  const [permanentDelete, setPermanentDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchDeletedCustomers()
  }, [])

  const fetchDeletedCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!vendor) return

      const { data } = await supabase
        .from('customers')
        .select('id, full_name, mobile_number, deleted_at')
        .eq('vendor_id', vendor.id)
        .eq('is_active', false)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      setDeletedCustomers(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (customerId: string) => {
    setRestoring(customerId)
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
          is_active: true,
          deleted_at: null
        })
        .eq('id', customerId)

      if (error) throw error
      
      setDeletedCustomers(prev => prev.filter(c => c.id !== customerId))
    } catch (error: any) {
      alert('Error restoring: ' + error.message)
    } finally {
      setRestoring(null)
    }
  }

  const handlePermanentDelete = async (customerId: string) => {
    try {
      // Delete related records first
      await supabase.from('attendance').delete().eq('customer_id', customerId)
      await supabase.from('payments').delete().eq('customer_id', customerId)
      await supabase.from('subscriptions').delete().eq('customer_id', customerId)
      
      // Then delete customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (error) throw error
      
      setDeletedCustomers(prev => prev.filter(c => c.id !== customerId))
      setPermanentDelete(null)
    } catch (error: any) {
      alert('Error deleting permanently: ' + error.message)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <div>
            <h1 className="text-lg font-bold text-gray-900">Recycle Bin</h1>
            <p className="text-sm text-gray-500">{deletedCustomers.length} deleted customer{deletedCustomers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        
        {deletedCustomers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Recycle Bin is Empty</h3>
            <p className="text-gray-500 text-sm">Deleted customers will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deletedCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{customer.full_name}</h3>
                    <p className="text-sm text-gray-500">{customer.mobile_number}</p>
                    <p className="text-xs text-gray-400">Deleted: {formatDate(customer.deleted_at)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(customer.id)}
                    disabled={restoring === customer.id}
                    className="flex-1 py-2.5 bg-green-100 text-green-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {restoring === customer.id ? 'Restoring...' : 'Restore'}
                  </button>
                  <button
                    onClick={() => setPermanentDelete(customer.id)}
                    className="flex-1 py-2.5 bg-red-100 text-red-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Permanent Delete Confirmation */}
      {permanentDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setPermanentDelete(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Permanently?</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                This action cannot be undone. All customer data, attendance, and payment records will be permanently deleted.
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => handlePermanentDelete(permanentDelete)}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold"
                >
                  Delete Forever
                </button>
                <button
                  onClick={() => setPermanentDelete(null)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}