import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Language = 'english' | 'hinglish'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.home': { english: 'Home', hinglish: 'Home' },
  'nav.customers': { english: 'Customers', hinglish: 'Customers' },
  'nav.track': { english: 'Track', hinglish: 'Track' },
  'nav.payments': { english: 'Payments', hinglish: 'Payments' },
  'nav.settings': { english: 'Settings', hinglish: 'Settings' },

  // Greetings
  'greeting.morning': { english: 'Good Morning! 👋', hinglish: 'Good Morning! 👋' },
  'greeting.afternoon': { english: 'Good Afternoon! ☀️', hinglish: 'Good Afternoon! ☀️' },
  'greeting.evening': { english: 'Good Evening! 🌙', hinglish: 'Good Evening! 🌙' },

  // Dashboard
  'dashboard.totalCustomers': { english: 'Total Customers', hinglish: 'Total Customers' },
  'dashboard.totalPending': { english: 'Total Pending', hinglish: 'Baaki Payment' },
  'dashboard.todayMeals': { english: "Today's Meals", hinglish: 'Aaj ke Meals' },
  'dashboard.thisMonth': { english: 'This Month', hinglish: 'Is Mahine' },
  'dashboard.quickActions': { english: 'Quick Actions', hinglish: 'Quick Actions' },
  'dashboard.markAttendance': { english: "Mark Today's Attendance", hinglish: 'Aaj ki Attendance Lagao' },
  'dashboard.addCustomer': { english: 'Add New Customer', hinglish: 'Naya Customer Add Karo' },
  'dashboard.quickSale': { english: 'Quick Sale (Walk-in)', hinglish: 'Quick Sale (Walk-in)' },
  'dashboard.expiringAlert': { english: 'subscription expiring soon', hinglish: 'subscription khatam hone wali hai' },
  'dashboard.tapToRenew': { english: 'Tap to view and renew', hinglish: 'Renew karne ke liye tap karo' },

  // Customers
  'customers.title': { english: 'Customers', hinglish: 'Customers' },
  'customers.search': { english: 'Search customers...', hinglish: 'Customer search karo...' },
  'customers.addNew': { english: 'Add Customer', hinglish: 'Customer Add Karo' },
  'customers.noCustomers': { english: 'No customers yet', hinglish: 'Abhi koi customer nahi' },
  'customers.addFirst': { english: 'Add your first customer to get started', hinglish: 'Pehla customer add karo' },
  'customers.pending': { english: 'Pending', hinglish: 'Baaki' },
  'customers.paid': { english: 'Paid', hinglish: 'Paid' },

  // Attendance
  'attendance.title': { english: 'Attendance', hinglish: 'Attendance' },
  'attendance.quickMark': { english: 'Quick Mark', hinglish: 'Quick Mark' },
  'attendance.calendar': { english: 'Calendar View', hinglish: 'Calendar View' },
  'attendance.lunch': { english: 'Lunch', hinglish: 'Lunch' },
  'attendance.dinner': { english: 'Dinner', hinglish: 'Dinner' },
  'attendance.guests': { english: 'Guests', hinglish: 'Guests' },
  'attendance.selectCustomer': { english: 'Select a customer to view calendar', hinglish: 'Calendar dekhne ke liye customer select karo' },

  // Payments
  'payments.title': { english: 'Payments', hinglish: 'Payments' },
  'payments.recordPayment': { english: 'Record Payment', hinglish: 'Payment Record Karo' },
  'payments.totalPending': { english: 'Total Pending', hinglish: 'Total Baaki' },
  'payments.collected': { english: 'Collected', hinglish: 'Collect Hua' },
  'payments.sendReminder': { english: 'Send Reminder', hinglish: 'Reminder Bhejo' },

  // Settings
  'settings.title': { english: 'Settings', hinglish: 'Settings' },
  'settings.editProfile': { english: 'Edit Profile', hinglish: 'Profile Edit Karo' },
  'settings.businessInfo': { english: 'Business info, contact details', hinglish: 'Business info, contact details' },
  'settings.menuManagement': { english: 'Menu Management', hinglish: 'Menu Management' },
  'settings.menuDesc': { english: 'Add, edit menu items & prices', hinglish: 'Menu items aur prices edit karo' },
  'settings.subscription': { english: 'Subscription', hinglish: 'Subscription' },
  'settings.subscriptionDesc': { english: 'Manage your TiffinOS plan', hinglish: 'Apna TiffinOS plan manage karo' },
  'settings.reports': { english: 'Business Reports', hinglish: 'Business Reports' },
  'settings.reportsDesc': { english: 'Download Excel reports', hinglish: 'Excel reports download karo' },
  'settings.recycleBin': { english: 'Recycle Bin', hinglish: 'Recycle Bin' },
  'settings.recycleBinDesc': { english: 'Restore deleted customers', hinglish: 'Delete kiye customers wapas lao' },
  'settings.language': { english: 'Language', hinglish: 'Language / भाषा' },
  'settings.languageDesc': { english: 'Change app language', hinglish: 'App ki bhasha badlo' },
  'settings.notifications': { english: 'Notifications', hinglish: 'Notifications' },
  'settings.support': { english: 'Support', hinglish: 'Support' },
  'settings.helpSupport': { english: 'Help & Support', hinglish: 'Help & Support' },
  'settings.contactWhatsApp': { english: 'Contact us on WhatsApp', hinglish: 'WhatsApp pe contact karo' },
  'settings.logout': { english: 'Logout', hinglish: 'Logout' },

  // Common
  'common.save': { english: 'Save', hinglish: 'Save Karo' },
  'common.cancel': { english: 'Cancel', hinglish: 'Cancel' },
  'common.delete': { english: 'Delete', hinglish: 'Delete' },
  'common.edit': { english: 'Edit', hinglish: 'Edit' },
  'common.back': { english: 'Back', hinglish: 'Back' },
  'common.next': { english: 'Next', hinglish: 'Aage' },
  'common.done': { english: 'Done', hinglish: 'Done' },
  'common.loading': { english: 'Loading...', hinglish: 'Loading...' },
  'common.noData': { english: 'No data found', hinglish: 'Kuch nahi mila' },
  'common.today': { english: 'Today', hinglish: 'Aaj' },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('english')

  useEffect(() => {
    const saved = localStorage.getItem('tiffinos_language')
    if (saved === 'english' || saved === 'hinglish') {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('tiffinos_language', lang)
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}