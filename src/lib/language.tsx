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
  'nav.home': { english: 'Home', hinglish: 'होम' },
  'nav.customers': { english: 'Customers', hinglish: 'ग्राहक' },
  'nav.track': { english: 'Track', hinglish: 'ट्रैक' },
  'nav.payments': { english: 'Payments', hinglish: 'भुगतान' },
  'nav.settings': { english: 'Settings', hinglish: 'सेटिंग्स' },

  // Greetings
  'greeting.morning': { english: 'Good Morning! 👋', hinglish: 'सुप्रभात! 👋' },
  'greeting.afternoon': { english: 'Good Afternoon! ☀️', hinglish: 'शुभ दोपहर! ☀️' },
  'greeting.evening': { english: 'Good Evening! 🌙', hinglish: 'शुभ संध्या! 🌙' },

  // Dashboard
  'dashboard.totalCustomers': { english: 'Total Customers', hinglish: 'कुल ग्राहक' },
  'dashboard.totalPending': { english: 'Total Pending', hinglish: 'कुल बकाया' },
  'dashboard.todayMeals': { english: "Today's Meals", hinglish: 'आज के भोजन' },
  'dashboard.thisMonth': { english: 'This Month', hinglish: 'इस महीने' },
  'dashboard.quickActions': { english: 'Quick Actions', hinglish: 'त्वरित कार्य' },
  'dashboard.markAttendance': { english: "Mark Today's Attendance", hinglish: 'आज की उपस्थिति दर्ज करें' },
  'dashboard.addCustomer': { english: 'Add New Customer', hinglish: 'नया ग्राहक जोड़ें' },
  'dashboard.quickSale': { english: 'Quick Sale (Walk-in)', hinglish: 'त्वरित बिक्री (वॉक-इन)' },
  'dashboard.expiringAlert': { english: 'subscription expiring soon', hinglish: 'सब्सक्रिप्शन जल्द समाप्त हो रहा है' },
  'dashboard.tapToRenew': { english: 'Tap to view and renew', hinglish: 'देखने और नवीनीकरण के लिए टैप करें' },

  // Customers
  'customers.title': { english: 'Customers', hinglish: 'ग्राहक' },
  'customers.search': { english: 'Search customers...', hinglish: 'ग्राहक खोजें...' },
  'customers.addNew': { english: 'Add Customer', hinglish: 'ग्राहक जोड़ें' },
  'customers.noCustomers': { english: 'No customers yet', hinglish: 'अभी कोई ग्राहक नहीं है' },
  'customers.addFirst': { english: 'Add your first customer to get started', hinglish: 'शुरू करने के लिए पहला ग्राहक जोड़ें' },
  'customers.pending': { english: 'Pending', hinglish: 'बकाया' },
  'customers.paid': { english: 'Paid', hinglish: 'भुगतान किया गया' },

  // Attendance
  'attendance.title': { english: 'Attendance', hinglish: 'उपस्थिति' },
  'attendance.quickMark': { english: 'Quick Mark', hinglish: 'त्वरित दर्ज' },
  'attendance.calendar': { english: 'Calendar View', hinglish: 'कैलेंडर दृश्य' },
  'attendance.lunch': { english: 'Lunch', hinglish: 'दोपहर का भोजन' },
  'attendance.dinner': { english: 'Dinner', hinglish: 'रात्रि भोजन' },
  'attendance.guests': { english: 'Guests', hinglish: 'अतिथि' },
  'attendance.selectCustomer': {
    english: 'Select a customer to view calendar',
    hinglish: 'कैलेंडर देखने के लिए ग्राहक चुनें'
  },

  // Payments
  'payments.title': { english: 'Payments', hinglish: 'भुगतान' },
  'payments.recordPayment': { english: 'Record Payment', hinglish: 'भुगतान दर्ज करें' },
  'payments.totalPending': { english: 'Total Pending', hinglish: 'कुल बकाया' },
  'payments.collected': { english: 'Collected', hinglish: 'वसूल किया गया' },
  'payments.sendReminder': { english: 'Send Reminder', hinglish: 'रिमाइंडर भेजें' },

  // Settings
  'settings.title': { english: 'Settings', hinglish: 'सेटिंग्स' },
  'settings.editProfile': { english: 'Edit Profile', hinglish: 'प्रोफाइल संपादित करें' },
  'settings.businessInfo': {
    english: 'Business info, contact details',
    hinglish: 'व्यवसाय जानकारी, संपर्क विवरण'
  },
  'settings.menuManagement': { english: 'Menu Management', hinglish: 'मेनू प्रबंधन' },
  'settings.menuDesc': {
    english: 'Add, edit menu items & prices',
    hinglish: 'मेनू आइटम और कीमतें जोड़ें या संपादित करें'
  },
  'settings.subscription': { english: 'Subscription', hinglish: 'सब्सक्रिप्शन' },
  'settings.subscriptionDesc': {
    english: 'Manage your TiffinOS plan',
    hinglish: 'अपने TiffinOS प्लान का प्रबंधन करें'
  },
  'settings.reports': { english: 'Business Reports', hinglish: 'व्यवसाय रिपोर्ट' },
  'settings.reportsDesc': {
    english: 'Download Excel reports',
    hinglish: 'एक्सेल रिपोर्ट डाउनलोड करें'
  },
  'settings.recycleBin': { english: 'Recycle Bin', hinglish: 'रीसायकल बिन' },
  'settings.recycleBinDesc': {
    english: 'Restore deleted customers',
    hinglish: 'हटाए गए ग्राहकों को पुनः प्राप्त करें'
  },
  'settings.language': { english: 'Language', hinglish: 'भाषा' },
  'settings.languageDesc': {
    english: 'Change app language',
    hinglish: 'ऐप की भाषा बदलें'
  },
  'settings.notifications': { english: 'Notifications', hinglish: 'सूचनाएं' },
  'settings.support': { english: 'Support', hinglish: 'सपोर्ट' },
  'settings.helpSupport': { english: 'Help & Support', hinglish: 'मदद और सपोर्ट' },
  'settings.contactWhatsApp': {
    english: 'Contact us on WhatsApp',
    hinglish: 'व्हाट्सऐप पर संपर्क करें'
  },
  'settings.logout': { english: 'Logout', hinglish: 'लॉगआउट' },

  // Common
  'common.save': { english: 'Save', hinglish: 'सहेजें' },
  'common.cancel': { english: 'Cancel', hinglish: 'रद्द करें' },
  'common.delete': { english: 'Delete', hinglish: 'हटाएं' },
  'common.edit': { english: 'Edit', hinglish: 'संपादित करें' },
  'common.back': { english: 'Back', hinglish: 'वापस' },
  'common.next': { english: 'Next', hinglish: 'आगे' },
  'common.done': { english: 'Done', hinglish: 'पूरा हुआ' },
  'common.loading': { english: 'Loading...', hinglish: 'लोड हो रहा है...' },
  'common.noData': { english: 'No data found', hinglish: 'कोई डेटा नहीं मिला' },
  'common.today': { english: 'Today', hinglish: 'आज' },
};


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