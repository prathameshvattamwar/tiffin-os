import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VendorProvider, useVendor } from './context/VendorContext'
import BottomNav from './components/ui/BottomNav'

// Lazy load all pages
const LoginPage = lazy(() => import('./features/auth/LoginPage'))
const OnboardingPage = lazy(() => import('./features/auth/OnboardingPage'))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'))
const CustomersPage = lazy(() => import('./features/customers/CustomersPage'))
const CustomerDetailPage = lazy(() => import('./features/customers/CustomerDetailPage'))
const AttendancePage = lazy(() => import('./features/attendance/AttendancePage'))
const PaymentsPage = lazy(() => import('./features/payments/PaymentsPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))
const ReportPage = lazy(() => import('./features/reports/ReportPage'))
const BusinessReportsPage = lazy(() => import('./features/reports/BusinessReportsPage'))
const SubscriptionPage = lazy(() => import('./features/settings/SubscriptionPage'))
const RecycleBinPage = lazy(() => import('./features/settings/RecycleBinPage'))
const HowToUsePage = lazy(() => import('./features/settings/HowToUsePage'))
const PrivacyPolicyPage = lazy(() => import('./features/settings/PrivacyPolicyPage'))
const MenuManagementPage = lazy(() => import('./features/settings/MenuManagementPage'))
const EditProfilePage = lazy(() => import('./features/settings/EditProfilePage'))
const QuickSalePage = lazy(() => import('./features/sales/QuickSalePage'))
const BroadcastPage = lazy(() => import('./features/settings/BroadcastPage'))

// Create Query Client with caching config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection (replaces cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Loading spinner component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

// Layout with bottom nav
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <BottomNav />
    </div>
  )
}

// Protected route wrapper
function ProtectedRoute({ children, withNav = true }: { children: React.ReactNode, withNav?: boolean }) {
  const { vendor, loading } = useVendor()

  if (loading) return <PageLoader />
  if (!vendor) return <Navigate to="/login" />
  if (!vendor.is_onboarded) return <Navigate to="/onboarding" />

  return withNav ? <AppLayout>{children}</AppLayout> : <>{children}</>
}

// Auth route (login/onboarding)
function AuthRoute({ children, type }: { children: React.ReactNode, type: 'login' | 'onboarding' }) {
  const { vendor, loading } = useVendor()

  if (loading) return <PageLoader />
  
  if (type === 'login') {
    if (vendor && vendor.is_onboarded) return <Navigate to="/" />
    if (vendor && !vendor.is_onboarded) return <Navigate to="/onboarding" />
  }
  
  if (type === 'onboarding') {
    if (!vendor) return <Navigate to="/login" />
    if (vendor.is_onboarded) return <Navigate to="/" />
  }

  return <>{children}</>
}

// Main App Routes
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthRoute type="login"><LoginPage /></AuthRoute>} />
        <Route path="/onboarding" element={<AuthRoute type="onboarding"><OnboardingPage /></AuthRoute>} />

        {/* Main Routes with Bottom Nav */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Detail Routes without Bottom Nav */}
        <Route path="/customer/:id" element={<ProtectedRoute withNav={false}><CustomerDetailPage /></ProtectedRoute>} />
        <Route path="/report/:id" element={<ProtectedRoute withNav={false}><ReportPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute withNav={false}><BusinessReportsPage /></ProtectedRoute>} />
        <Route path="/quick-sale" element={<ProtectedRoute withNav={false}><QuickSalePage /></ProtectedRoute>} />

        {/* Settings Sub-routes */}
        <Route path="/settings/menu" element={<ProtectedRoute withNav={false}><MenuManagementPage /></ProtectedRoute>} />
        <Route path="/settings/profile" element={<ProtectedRoute withNav={false}><EditProfilePage /></ProtectedRoute>} />
        <Route path="/settings/subscription" element={<ProtectedRoute withNav={false}><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/settings/recycle-bin" element={<ProtectedRoute withNav={false}><RecycleBinPage /></ProtectedRoute>} />
        <Route path="/settings/how-to-use" element={<ProtectedRoute withNav={false}><HowToUsePage /></ProtectedRoute>} />
        <Route path="/settings/privacy" element={<ProtectedRoute withNav={false}><PrivacyPolicyPage /></ProtectedRoute>} />
        <Route path="/settings/broadcast" element={<ProtectedRoute withNav={false}><BroadcastPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VendorProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </VendorProvider>
    </QueryClientProvider>
  )
}

export default App