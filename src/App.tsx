import { Home, Users, CalendarCheck, FileText, Settings, UtensilsCrossed } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8 text-orange-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          TiffinOS
        </h1>
        <p className="text-gray-500 mb-8">
          तुमचा व्यवसाय, तुमच्या हातात
        </p>
        
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex flex-col items-center gap-1">
            <Home className="w-6 h-6 text-orange-500" />
            <span className="text-xs text-gray-500">Home</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Users className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500">Customers</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CalendarCheck className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500">Track</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FileText className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500">Reports</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Settings className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500">Settings</span>
          </div>
        </div>
        
        <button className="w-full bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
          Get Started
        </button>
        
      </div>
    </div>
  )
}

export default App