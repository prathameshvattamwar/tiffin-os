import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, CalendarCheck, IndianRupee, FileText, Settings, ChevronDown, ChevronUp, Play, CheckCircle } from 'lucide-react'

interface GuideSection {
  id: string
  icon: React.ReactNode
  title: string
  titleHi: string
  steps: Array<{
    title: string
    titleHi: string
    description: string
    descriptionHi: string
  }>
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'customers',
    icon: <Users className="w-6 h-6" />,
    title: 'Managing Customers',
    titleHi: 'Customers कसे Manage करायचे',
    steps: [
      {
        title: 'Add New Customer',
        titleHi: 'नवीन Customer Add करा',
        description: 'Go to Customers tab → Tap "+ Add" button → Fill customer details (name, mobile, meal plan) → Save',
        descriptionHi: 'Customers tab वर जा → "+ Add" button दाबा → Customer details भरा (name, mobile, meal plan) → Save करा'
      },
      {
        title: 'View Customer Details',
        titleHi: 'Customer Details बघा',
        description: 'Tap on any customer card to see their full details, subscription, payments and attendance history',
        descriptionHi: 'कोणत्याही customer card वर tap करा - त्यांची पूर्ण details, subscription, payments आणि attendance history दिसेल'
      },
      {
        title: 'Edit or Delete Customer',
        titleHi: 'Customer Edit किंवा Delete करा',
        description: 'Open customer → Tap pencil icon to edit OR tap trash icon to delete. Deleted customers go to Recycle Bin',
        descriptionHi: 'Customer उघडा → Edit साठी pencil icon दाबा किंवा Delete साठी trash icon दाबा. Delete केलेले customers Recycle Bin मध्ये जातात'
      }
    ]
  },
  {
    id: 'attendance',
    icon: <CalendarCheck className="w-6 h-6" />,
    title: 'Daily Attendance',
    titleHi: 'Daily Attendance कशी Mark करायची',
    steps: [
      {
        title: 'Quick Mark (Recommended)',
        titleHi: 'Quick Mark (सोपी पद्धत)',
        description: 'Go to Track tab → See all customers → Tap "Lunch" or "Dinner" button to mark present. Use +/- for guest count',
        descriptionHi: 'Track tab वर जा → सगळे customers दिसतील → "Lunch" किंवा "Dinner" button दाबून present mark करा. Guest साठी +/- वापरा'
      },
      {
        title: 'Calendar View',
        titleHi: 'Calendar View',
        description: 'Switch to "Calendar View" → Select a customer → Tap any date to mark/edit attendance for that day',
        descriptionHi: '"Calendar View" वर switch करा → Customer select करा → कोणतीही date tap करून त्या दिवसाची attendance mark/edit करा'
      },
      {
        title: 'Guest Meals',
        titleHi: 'Guest Meals',
        description: 'When customer brings guests, tap + button next to guest count. ₹40 per guest is automatically added to their bill',
        descriptionHi: 'Customer सोबत guest आला तर + button दाबा. प्रति guest ₹40 automatically bill मध्ये add होतो'
      }
    ]
  },
  {
    id: 'payments',
    icon: <IndianRupee className="w-6 h-6" />,
    title: 'Recording Payments',
    titleHi: 'Payments कसे Record करायचे',
    steps: [
      {
        title: 'Record New Payment',
        titleHi: 'नवीन Payment Record करा',
        description: 'Go to Payments tab → Tap customer with pending amount → Enter amount received → Select payment mode (Cash/UPI/Card) → Save',
        descriptionHi: 'Payments tab वर जा → Pending amount असलेला customer tap करा → Amount भरा → Payment mode select करा (Cash/UPI/Card) → Save करा'
      },
      {
        title: 'Send Payment Reminder',
        titleHi: 'Payment Reminder पाठवा',
        description: 'In Payments tab → Tap WhatsApp icon next to customer → Reminder message will be sent automatically',
        descriptionHi: 'Payments tab मध्ये → Customer च्या बाजूला WhatsApp icon दाबा → Reminder message automatically पाठवला जाईल'
      },
      {
        title: 'View Payment History',
        titleHi: 'Payment History बघा',
        description: 'Open any customer → Scroll down to see complete payment history with dates and modes',
        descriptionHi: 'कोणताही customer उघडा → खाली scroll करा - complete payment history dates आणि modes सह दिसेल'
      }
    ]
  },
  {
    id: 'reports',
    icon: <FileText className="w-6 h-6" />,
    title: 'Reports & Sharing',
    titleHi: 'Reports आणि Sharing',
    steps: [
      {
        title: 'Customer Report (WhatsApp)',
        titleHi: 'Customer Report (WhatsApp)',
        description: 'Open customer → Tap "Generate Report" → Report opens → Tap "Share on WhatsApp" to send to customer',
        descriptionHi: 'Customer उघडा → "Generate Report" दाबा → Report दिसेल → "Share on WhatsApp" दाबून customer ला पाठवा'
      },
      {
        title: 'Download Business Report',
        titleHi: 'Business Report Download करा',
        description: 'Go to Settings → Business Reports → Select month/week → Download Excel file with all customer data, attendance & payments',
        descriptionHi: 'Settings → Business Reports वर जा → Month/Week select करा → Excel file download होईल - सगळ्या customers चा data, attendance आणि payments'
      },
      {
        title: 'Quick Sale Report',
        titleHi: 'Quick Sale Report',
        description: 'For walk-in customers: Dashboard → Quick Sale → Select items → Generate bill instantly',
        descriptionHi: 'Walk-in customers साठी: Dashboard → Quick Sale → Items select करा → Bill instantly generate होईल'
      }
    ]
  },
  {
    id: 'subscription',
    icon: <Settings className="w-6 h-6" />,
    title: 'Subscription & Renewal',
    titleHi: 'Subscription आणि Renewal',
    steps: [
      {
        title: 'Renew Customer Subscription',
        titleHi: 'Customer Subscription Renew करा',
        description: 'When subscription is expiring (7 days before), open customer → Tap "Renew Subscription" → Set new dates and amount → Confirm',
        descriptionHi: 'Subscription expire होण्याच्या 7 दिवस आधी, customer उघडा → "Renew Subscription" दाबा → नवीन dates आणि amount set करा → Confirm करा'
      },
      {
        title: 'Upgrade Your Plan',
        titleHi: 'तुमचा Plan Upgrade करा',
        description: 'Settings → Subscription → Choose Starter (₹299) or Pro (₹449) plan → Contact on WhatsApp for activation',
        descriptionHi: 'Settings → Subscription → Starter (₹299) किंवा Pro (₹449) plan निवडा → Activation साठी WhatsApp वर contact करा'
      },
      {
        title: 'Check Plan Limits',
        titleHi: 'Plan Limits बघा',
        description: 'Free Trial: 20 customers, 3 reports/month. Starter: 50 customers. Pro: Unlimited customers & reports',
        descriptionHi: 'Free Trial: 20 customers, 3 reports/month. Starter: 50 customers. Pro: Unlimited customers आणि reports'
      }
    ]
  }
]

export default function HowToUsePage() {
  const navigate = useNavigate()
  const [expandedSection, setExpandedSection] = useState<string | null>('customers')

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">How to Use TiffinOS</h1>
            <p className="text-orange-100 text-sm">TiffinOS कसे वापरायचे</p>
          </div>
        </div>
        
        <div className="bg-white/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">Quick Start Guide</p>
              <p className="text-sm text-orange-100">5 simple steps to manage your tiffin business</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">

        {/* Quick Overview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Quick Overview
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-blue-50 p-3 rounded-xl">
              <p className="font-medium text-blue-800">1. Add Customers</p>
              <p className="text-blue-600 text-xs">Customers tab मध्ये</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl">
              <p className="font-medium text-orange-800">2. Mark Attendance</p>
              <p className="text-orange-600 text-xs">Track tab मध्ये daily</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <p className="font-medium text-green-800">3. Record Payments</p>
              <p className="text-green-600 text-xs">Payments tab मध्ये</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <p className="font-medium text-purple-800">4. Share Reports</p>
              <p className="text-purple-600 text-xs">Customer → Report</p>
            </div>
          </div>
        </div>

        {/* Detailed Guide Sections */}
        {GUIDE_SECTIONS.map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                {section.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">{section.title}</p>
                <p className="text-sm text-gray-500">{section.titleHi}</p>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="px-4 pb-4 space-y-3">
                {section.steps.map((step, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{step.title}</p>
                        <p className="text-xs text-orange-600 mb-2">{step.titleHi}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <p className="text-sm text-gray-500 mt-1 italic">{step.descriptionHi}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Need Help */}
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
          <h3 className="font-semibold text-green-800 mb-2">🆘 Need More Help?</h3>
          <p className="text-sm text-green-700 mb-4">
            काही समजलं नाही? आम्हाला WhatsApp वर contact करा - आम्ही मदत करू!
          </p>
          <button
            onClick={() => window.open('https://wa.me/919271981229?text=Hi! I need help using TiffinOS app.', '_blank')}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold"
          >
            💬 Chat on WhatsApp
          </button>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <h3 className="font-semibold text-amber-800 mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-amber-700 space-y-2">
            <li>• रोज सकाळी/संध्याकाळी attendance mark करा</li>
            <li>• महिन्याच्या शेवटी सगळ्यांना report पाठवा</li>
            <li>• Pending payment साठी WhatsApp reminder वापरा</li>
            <li>• Guest meals track करायला विसरू नका</li>
          </ul>
        </div>

      </div>
    </div>
  )
}