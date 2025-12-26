import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Calendar, FileSpreadsheet, Users, IndianRupee, UtensilsCrossed, Lock, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

interface VendorPlan {
  subscription_plan: string
  plan_end_date: string
}

interface ReportData {
  customers: any[]
  attendance: any[]
  payments: any[]
  subscriptions: any[]
}

const DOWNLOAD_LIMITS: Record<string, number> = {
  'free_trial': 3,
  'starter_monthly': 5,
  'starter_quarterly': 5,
  'pro_monthly': 999999,
  'pro_quarterly': 999999
}

export default function BusinessReportsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [vendorPlan, setVendorPlan] = useState<VendorPlan | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [downloadsThisMonth, setDownloadsThisMonth] = useState(0)
  const [downloadDataLoaded, setDownloadDataLoaded] = useState(false)
  
  // Report filters
  const [reportType, setReportType] = useState<'monthly' | 'weekly' | 'custom'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
  fetchVendorData()
  }, [])

  useEffect(() => {
    if (vendorId) {
      loadDownloadCount()
    }
  }, [vendorId])

  const fetchVendorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, business_name, subscription_plan, plan_end_date')
        .eq('auth_user_id', user.id)
        .single()

      if (vendor) {
        setVendorId(vendor.id)
        setBusinessName(vendor.business_name || 'TiffinOS')
        setVendorPlan({
          subscription_plan: vendor.subscription_plan || 'free_trial',
          plan_end_date: vendor.plan_end_date || ''
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDownloadCount = async () => {
    if (!vendorId) return
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      const { data } = await supabase
        .from('vendors')
        .select('report_downloads_count, report_downloads_month')
        .eq('id', vendorId)
        .single()

      if (data) {
        if (data.report_downloads_month === currentMonth) {
          setDownloadsThisMonth(data.report_downloads_count || 0)
        } else {
          // New month - reset count in database
          await supabase
            .from('vendors')
            .update({ 
              report_downloads_count: 0, 
              report_downloads_month: currentMonth 
            })
            .eq('id', vendorId)
          setDownloadsThisMonth(0)
        }
      }
    } catch (error) {
      console.error('Error loading download count:', error)
    } finally {
      setDownloadDataLoaded(true)
    }
  }

  const incrementDownloadCount = async () => {
    if (!vendorId) return
    
    const currentMonth = new Date().toISOString().slice(0, 7)
    const newCount = downloadsThisMonth + 1
    
    try {
      await supabase
        .from('vendors')
        .update({ 
          report_downloads_count: newCount, 
          report_downloads_month: currentMonth 
        })
        .eq('id', vendorId)
      
      setDownloadsThisMonth(newCount)
    } catch (error) {
      console.error('Error updating download count:', error)
    }
  }

  const getDownloadLimit = () => {
    return DOWNLOAD_LIMITS[vendorPlan?.subscription_plan || 'free_trial'] || 3
  }

  const canDownload = () => {
    const limit = getDownloadLimit()
    return downloadsThisMonth < limit
  }

  const getDateRange = () => {
    if (reportType === 'monthly') {
      const [year, month] = selectedMonth.split('-')
      const start = new Date(parseInt(year), parseInt(month) - 1, 1)
      const end = new Date(parseInt(year), parseInt(month), 0)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      }
    } else if (reportType === 'weekly') {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const start = new Date(today)
      start.setDate(today.getDate() - dayOfWeek)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        label: `Week of ${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      }
    } else {
      return {
        start: customStart,
        end: customEnd,
        label: `${customStart} to ${customEnd}`
      }
    }
  }

  const fetchReportData = async (startDate: string, endDate: string): Promise<ReportData> => {
    // Fetch all customers
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)

    // Fetch attendance in date range
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)

    // Fetch payments in date range
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)

    // Fetch active subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('status', 'active')

    return {
      customers: customers || [],
      attendance: attendance || [],
      payments: payments || [],
      subscriptions: subscriptions || []
    }
  }

  const generateExcelReport = async () => {
    if (!canDownload()) {
      alert('Download limit reached! Upgrade your plan for more downloads.')
      return
    }

    if (reportType === 'custom' && (!customStart || !customEnd)) {
      alert('Please select start and end dates')
      return
    }

    setGenerating(true)

    try {
      const { start, end, label } = getDateRange()
      const data = await fetchReportData(start, end)

      // Create workbook
      const wb = XLSX.utils.book_new()

      // === SHEET 1: Summary ===
      const summaryData = [
        ['📊 BUSINESS REPORT - ' + businessName.toUpperCase()],
        [''],
        ['Report Period:', label],
        ['Generated On:', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
        [''],
        ['📈 KEY METRICS'],
        [''],
        ['Total Active Customers', data.customers.length],
        ['Total Meals Served', data.attendance.reduce((sum, a) => sum + (a.lunch_taken ? 1 : 0) + (a.dinner_taken ? 1 : 0), 0)],
        ['├─ Lunch', data.attendance.filter(a => a.lunch_taken).length],
        ['└─ Dinner', data.attendance.filter(a => a.dinner_taken).length],
        ['Total Guest Meals', data.attendance.reduce((sum, a) => sum + (a.guest_count || 0), 0)],
        [''],
        ['💰 REVENUE'],
        [''],
        ['Total Collection', '₹' + data.payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('en-IN')],
        ['├─ Cash', '₹' + data.payments.filter(p => p.payment_mode === 'cash').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('en-IN')],
        ['├─ UPI', '₹' + data.payments.filter(p => p.payment_mode === 'upi').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('en-IN')],
        ['├─ Card', '₹' + data.payments.filter(p => p.payment_mode === 'card').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('en-IN')],
        ['└─ Bank Transfer', '₹' + data.payments.filter(p => p.payment_mode === 'bank_transfer').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('en-IN')],
        [''],
        ['Guest Revenue (₹40/guest)', '₹' + (data.attendance.reduce((sum, a) => sum + (a.guest_count || 0), 0) * 40).toLocaleString('en-IN')],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

      // === SHEET 2: Customer Details ===
      const customerRows = data.customers.map(c => {
        const custAttendance = data.attendance.filter(a => a.customer_id === c.id)
        const custPayments = data.payments.filter(p => p.customer_id === c.id)
        const custSub = data.subscriptions.find(s => s.customer_id === c.id)
        
        const daysPresent = new Set(custAttendance.map(a => a.attendance_date)).size
        const lunchCount = custAttendance.filter(a => a.lunch_taken).length
        const dinnerCount = custAttendance.filter(a => a.dinner_taken).length
        const totalMeals = lunchCount + dinnerCount
        const guestCount = custAttendance.reduce((sum, a) => sum + (a.guest_count || 0), 0)
        const totalPaid = custPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        const planAmount = custSub?.plan_amount || 0
        const guestCharges = guestCount * 40
        const pending = Math.max(0, planAmount + guestCharges - totalPaid)

        return {
          'Customer Name': c.full_name,
          'Mobile': c.mobile_number,
          'Type': c.customer_type === 'monthly' ? 'Monthly' : 'Walk-in',
          'Meal Type': c.meal_type === 'veg' ? 'Veg' : c.meal_type === 'non_veg' ? 'Non-Veg' : 'Both',
          'Days Present': daysPresent,
          'Lunch Count': lunchCount,
          'Dinner Count': dinnerCount,
          'Total Meals': totalMeals,
          'Guest Meals': guestCount,
          'Plan Amount': planAmount,
          'Guest Charges': guestCharges,
          'Total Paid': totalPaid,
          'Pending': pending
        }
      })
      const customerSheet = XLSX.utils.json_to_sheet(customerRows)
      customerSheet['!cols'] = [
        { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
      ]
      XLSX.utils.book_append_sheet(wb, customerSheet, 'Customers')

      // === SHEET 3: Daily Attendance ===
      const attendanceRows = data.attendance.map(a => {
        const customer = data.customers.find(c => c.id === a.customer_id)
        return {
          'Date': new Date(a.attendance_date).toLocaleDateString('en-IN'),
          'Customer': customer?.full_name || 'Unknown',
          'Lunch': a.lunch_taken ? '✓' : '✗',
          'Dinner': a.dinner_taken ? '✓' : '✗',
          'Guests': a.guest_count || 0,
          'Notes': a.notes || ''
        }
      }).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceRows)
      attendanceSheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 25 }]
      XLSX.utils.book_append_sheet(wb, attendanceSheet, 'Attendance')

      // === SHEET 4: Payments ===
      const paymentRows = data.payments.map(p => {
        const customer = data.customers.find(c => c.id === p.customer_id)
        return {
          'Date': new Date(p.payment_date).toLocaleDateString('en-IN'),
          'Customer': customer?.full_name || 'Unknown',
          'Amount': p.amount,
          'Mode': p.payment_mode?.toUpperCase() || 'CASH',
          'Type': p.payment_type || 'Payment',
          'Status': p.status || 'Completed'
        }
      }).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      const paymentSheet = XLSX.utils.json_to_sheet(paymentRows)
      paymentSheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, paymentSheet, 'Payments')

      // Download file
      const fileName = `${businessName.replace(/\s+/g, '_')}_Report_${label.replace(/\s+/g, '_')}.xlsx`
      XLSX.writeFile(wb, fileName)

      // Increment download count
      await incrementDownloadCount()

      alert('✅ Report downloaded successfully!')

    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadLimit = getDownloadLimit()
  const remainingDownloads = Math.max(0, downloadLimit - downloadsThisMonth)

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
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Business Reports</h1>
            <p className="text-sm text-gray-500">Download Excel reports</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Download Limit Banner */}
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          remainingDownloads > 0 
            ? 'bg-blue-50 border border-blue-100' 
            : 'bg-red-50 border border-red-100'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            remainingDownloads > 0 ? 'bg-blue-100' : 'bg-red-100'
          }`}>
            {remainingDownloads > 0 ? (
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            ) : (
              <Lock className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${remainingDownloads > 0 ? 'text-blue-800' : 'text-red-800'}`}>
              {remainingDownloads > 0 
                ? `${remainingDownloads} download${remainingDownloads !== 1 ? 's' : ''} remaining this month`
                : 'Download limit reached!'
              }
            </p>
            <p className={`text-sm ${remainingDownloads > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {downloadLimit === 999999 ? 'Unlimited downloads with Pro plan' : `${downloadLimit} downloads/month on your plan`}
            </p>
          </div>
          {remainingDownloads === 0 && (
            <button
              onClick={() => navigate('/settings/subscription')}
              className="px-3 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-lg"
            >
              Upgrade
            </button>
          )}
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Report Type</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'monthly', label: 'Monthly', icon: '📅' },
              { value: 'weekly', label: 'This Week', icon: '📆' },
              { value: 'custom', label: 'Custom', icon: '🗓️' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value as any)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  reportType === type.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-sm font-medium text-gray-800">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">
            {reportType === 'monthly' ? 'Select Month' : reportType === 'custom' ? 'Select Date Range' : 'Current Week'}
          </h3>
          
          {reportType === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          )}

          {reportType === 'weekly' && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-gray-600">{getDateRange().label}</p>
              <p className="text-sm text-gray-400">{getDateRange().start} to {getDateRange().end}</p>
            </div>
          )}

          {reportType === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Report Contents Preview */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Report Contains</h3>
          <div className="space-y-2">
            {[
              { icon: <FileSpreadsheet className="w-4 h-4" />, text: 'Business Summary (Revenue, Meals, Customers)' },
              { icon: <Users className="w-4 h-4" />, text: 'Customer Details with Attendance & Payments' },
              { icon: <UtensilsCrossed className="w-4 h-4" />, text: 'Daily Attendance Log (Lunch/Dinner/Guests)' },
              { icon: <IndianRupee className="w-4 h-4" />, text: 'Payment Transactions (Cash/UPI/Card/Bank)' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  {item.icon}
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={generateExcelReport}
          disabled={generating || !canDownload()}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
            canDownload()
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download Excel Report
            </>
          )}
        </button>

        {/* Upgrade CTA */}
        {vendorPlan?.subscription_plan === 'free_trial' && (
          <div 
            onClick={() => navigate('/settings/subscription')}
            className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Need more downloads?</p>
                <p className="text-sm text-orange-100">Upgrade to Starter for 5/month or Pro for unlimited!</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}