import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import BottomNav from './components/ui/BottomNav'

// Temporary: Change to true to see dashboard
const isLoggedIn = true

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPage />
      <BottomNav />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/" /> : <LoginPage />} 
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" />}
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App