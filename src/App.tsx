import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './features/auth/LoginPage'
import OnboardingPage from './features/auth/OnboardingPage'
import DashboardPage from './features/dashboard/DashboardPage'
import CustomersPage from './features/customers/CustomersPage'
import AttendancePage from './features/attendance/AttendancePage'
import BottomNav from './components/ui/BottomNav'
import PaymentsPage from './features/payments/PaymentsPage'
import SettingsPage from './features/settings/SettingsPage'
import CustomerDetailPage from './features/customers/CustomerDetailPage'
import ReportPage from './features/reports/ReportPage'
import MenuManagementPage from './features/settings/MenuManagementPage'
import QuickSalePage from './features/sales/QuickSalePage'
import EditProfilePage from './features/settings/EditProfilePage'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <BottomNav />
    </div>
  )
}

function App() {
  const [authState, setAuthState] = useState<'loading' | 'logged_out' | 'needs_onboarding' | 'logged_in'>('loading')

  useEffect(() => {
    checkAuthAndOnboarding()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuthAndOnboarding()
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuthAndOnboarding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setAuthState('logged_out')
        return
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, is_onboarded')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!vendor || !vendor.is_onboarded) {
        setAuthState('needs_onboarding')
      } else {
        setAuthState('logged_in')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthState('logged_out')
    }
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={authState === 'logged_out' ? <LoginPage /> : <Navigate to="/" />} 
        />

        <Route 
          path="/onboarding" 
          element={authState === 'needs_onboarding' ? <OnboardingPage /> : <Navigate to="/" />} 
        />

        <Route
          path="/"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <AppLayout><DashboardPage /></AppLayout>
          }
        />

        <Route
          path="/customers"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <AppLayout><CustomersPage /></AppLayout>
          }
        />

        <Route
          path="/track"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <AppLayout><AttendancePage /></AppLayout>
          }
        />

        <Route
          path="/payments"
                element={
                  authState === 'logged_out' ? <Navigate to="/login" /> :
                  authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
                  <AppLayout><PaymentsPage /></AppLayout>
                }
        />

        <Route
          path="/settings"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <AppLayout><SettingsPage /></AppLayout>
          }
        />

        <Route
          path="/settings/menu"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <MenuManagementPage />
          }
        />

        <Route
          path="/customer/:id"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <CustomerDetailPage />
          }
        />

        <Route
          path="/report/:id"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <ReportPage />
          }
        />

        <Route
          path="/quick-sale"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <QuickSalePage />
          }
        />

        <Route
          path="/settings/profile"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <EditProfilePage />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App