import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Language = 'english' | 'hindi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.home': { english: 'Home', hindi: 'होम' },
  'nav.customers': { english: 'Customers', hindi: 'ग्राहक' },
  'nav.track': { english: 'Track', hindi: 'ट्रैक' },
  'nav.payments': { english: 'Payments', hindi: 'भुगतान' },
  'nav.settings': { english: 'Settings', hindi: 'सेटिंग्स' },

  // Greetings
  'greeting.morning': { english: 'Good Morning! 👋', hindi: 'सुप्रभात! 👋' },
  'greeting.afternoon': { english: 'Good Afternoon! ☀️', hindi: 'शुभ दोपहर! ☀️' },
  'greeting.evening': { english: 'Good Evening! 🌙', hindi: 'शुभ संध्या! 🌙' },

  // Dashboard
  'dashboard.totalCustomers': { english: 'Total Customers', hindi: 'कुल ग्राहक' },
  'dashboard.totalPending': { english: 'Total Pending', hindi: 'कुल बकाया' },
  'dashboard.todayMeals': { english: "Today's Meals", hindi: 'आज के भोजन' },
  'dashboard.thisMonth': { english: 'This Month', hindi: 'इस महीने' },
  'dashboard.quickActions': { english: 'Quick Actions', hindi: 'त्वरित कार्य' },
  'dashboard.markAttendance': { english: "Mark Today's Attendance", hindi: 'आज की उपस्थिति दर्ज करें' },
  'dashboard.addCustomer': { english: 'Add New Customer', hindi: 'नया ग्राहक जोड़ें' },
  'dashboard.quickSale': { english: 'Quick Sale (Walk-in)', hindi: 'त्वरित बिक्री (वॉक-इन)' },
  'dashboard.expiringAlert': { english: 'subscription expiring soon', hindi: 'सब्सक्रिप्शन जल्द समाप्त हो रहा है' },
  'dashboard.tapToRenew': { english: 'Tap to view and renew', hindi: 'देखने और नवीनीकरण के लिए टैप करें' },

  // Customers
  'customers.title': { english: 'Customers', hindi: 'ग्राहक' },
  'customers.search': { english: 'Search customers...', hindi: 'ग्राहक खोजें...' },
  'customers.addNew': { english: 'Add Customer', hindi: 'ग्राहक जोड़ें' },
  'customers.noCustomers': { english: 'No customers yet', hindi: 'अभी कोई ग्राहक नहीं है' },
  'customers.addFirst': { english: 'Add your first customer to get started', hindi: 'शुरू करने के लिए पहला ग्राहक जोड़ें' },
  'customers.pending': { english: 'Pending', hindi: 'बकाया' },
  'customers.paid': { english: 'Paid', hindi: 'भुगतान किया गया' },

  // Attendance
  'attendance.title': { english: 'Attendance', hindi: 'उपस्थिति' },
  'attendance.quickMark': { english: 'Quick Mark', hindi: 'त्वरित दर्ज' },
  'attendance.calendar': { english: 'Calendar View', hindi: 'कैलेंडर दृश्य' },
  'attendance.lunch': { english: 'Lunch', hindi: 'दोपहर का भोजन' },
  'attendance.dinner': { english: 'Dinner', hindi: 'रात्रि भोजन' },
  'attendance.guests': { english: 'Guests', hindi: 'अतिथि' },
  'attendance.selectCustomer': {
    english: 'Select a customer to view calendar',
    hindi: 'कैलेंडर देखने के लिए ग्राहक चुनें'
  },

  // Payments
  'payments.title': { english: 'Payments', hindi: 'भुगतान' },
  'payments.recordPayment': { english: 'Record Payment', hindi: 'भुगतान दर्ज करें' },
  'payments.totalPending': { english: 'Total Pending', hindi: 'कुल बकाया' },
  'payments.collected': { english: 'Collected', hindi: 'वसूल किया गया' },
  'payments.sendReminder': { english: 'Send Reminder', hindi: 'रिमाइंडर भेजें' },

  // Settings
  'settings.title': { english: 'Settings', hindi: 'सेटिंग्स' },
  'settings.editProfile': { english: 'Edit Profile', hindi: 'प्रोफाइल संपादित करें' },
  'settings.businessInfo': {
    english: 'Business info, contact details',
    hindi: 'व्यवसाय जानकारी, संपर्क विवरण'
  },
  'settings.menuManagement': { english: 'Menu Management', hindi: 'मेनू प्रबंधन' },
  'settings.menuDesc': {
    english: 'Add, edit menu items & prices',
    hindi: 'मेनू आइटम और कीमतें जोड़ें या संपादित करें'
  },
  'settings.subscription': { english: 'Subscription', hindi: 'सब्सक्रिप्शन' },
  'settings.subscriptionDesc': {
    english: 'Manage your TiffinOS plan',
    hindi: 'अपने TiffinOS प्लान का प्रबंधन करें'
  },
  'settings.reports': { english: 'Business Reports', hindi: 'व्यवसाय रिपोर्ट' },
  'settings.reportsDesc': {
    english: 'Download Excel reports',
    hindi: 'एक्सेल रिपोर्ट डाउनलोड करें'
  },
  'settings.recycleBin': { english: 'Recycle Bin', hindi: 'रीसायकल बिन' },
  'settings.recycleBinDesc': {
    english: 'Restore deleted customers',
    hindi: 'हटाए गए ग्राहकों को पुनः प्राप्त करें'
  },
  'settings.language': { english: 'Language', hindi: 'भाषा' },
  'settings.languageDesc': {
    english: 'Change app language',
    hindi: 'ऐप की भाषा बदलें'
  },
  'settings.notifications': { english: 'Notifications', hindi: 'सूचनाएं' },
  'settings.support': { english: 'Support', hindi: 'सपोर्ट' },
  'settings.helpSupport': { english: 'Help & Support', hindi: 'मदद और सपोर्ट' },
  'settings.contactWhatsApp': {
    english: 'Contact us on WhatsApp',
    hindi: 'व्हाट्सऐप पर संपर्क करें'
  },
  'settings.logout': { english: 'Logout', hindi: 'लॉगआउट' },

  // Common
  'common.save': { english: 'Save', hindi: 'सहेजें' },
  'common.cancel': { english: 'Cancel', hindi: 'रद्द करें' },
  'common.delete': { english: 'Delete', hindi: 'हटाएं' },
  'common.edit': { english: 'Edit', hindi: 'संपादित करें' },
  'common.back': { english: 'Back', hindi: 'वापस' },
  'common.next': { english: 'Next', hindi: 'आगे' },
  'common.done': { english: 'Done', hindi: 'पूरा हुआ' },
  'common.loading': { english: 'Loading...', hindi: 'लोड हो रहा है...' },
  'common.noData': { english: 'No data found', hindi: 'कोई डेटा नहीं मिला' },
  'common.today': { english: 'Today', hindi: 'आज' },
};


const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('english')

  useEffect(() => {
    const saved = localStorage.getItem('tiffinos_language')
    if (saved === 'english' || saved === 'hindi') {
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