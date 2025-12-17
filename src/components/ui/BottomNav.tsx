import { NavLink } from 'react-router-dom'
import { Home, Users, CalendarCheck, FileText, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/track', icon: CalendarCheck, label: 'Track' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-xl transition ${
                isActive
                  ? 'text-orange-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}