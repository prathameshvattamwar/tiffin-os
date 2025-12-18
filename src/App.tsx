import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './features/auth/LoginPage'
import OnboardingPage from './features/auth/OnboardingPage'
import DashboardPage from './features/dashboard/DashboardPage'
import BottomNav from './components/ui/BottomNav'

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPage />
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

      // Check if vendor profile exists
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

  // Loading state
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
        {/* Login */}
        <Route 
          path="/login" 
          element={authState === 'logged_out' ? <LoginPage /> : <Navigate to="/" />} 
        />

        {/* Onboarding */}
        <Route 
          path="/onboarding" 
          element={authState === 'needs_onboarding' ? <OnboardingPage /> : <Navigate to="/" />} 
        />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            authState === 'logged_out' ? <Navigate to="/login" /> :
            authState === 'needs_onboarding' ? <Navigate to="/onboarding" /> :
            <AppLayout />
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App