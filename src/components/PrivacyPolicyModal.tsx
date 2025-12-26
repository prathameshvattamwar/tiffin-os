import { X } from 'lucide-react'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Privacy Policy</h2>
            <p className="text-sm text-gray-500">गोपनीयता नीति</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Data We Collect</h3>
            <p className="text-gray-600 mb-2">
              We collect only essential information: your business name, contact details, customer information, attendance records, and payment data.
            </p>
            <p className="text-gray-500 italic text-xs">
              हम सिर्फ ज़रूरी जानकारी लेते हैं: बिज़नेस नाम, कॉन्टैक्ट, कस्टमर डेटा, अटेंडेंस और पेमेंट।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. How We Protect Your Data</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mb-2">
              <li>All data is encrypted during transfer and storage</li>
              <li>We use industry-standard cloud security</li>
              <li>Only you can access your business data</li>
            </ul>
            <p className="text-gray-500 italic text-xs">
              आपका डेटा एन्क्रिप्टेड है और सुरक्षित सर्वर पर स्टोर होता है।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Data Sharing</h3>
            <p className="text-gray-600 mb-2">
              We never sell, share, or distribute your data to third parties. Your business information stays private.
            </p>
            <p className="text-gray-500 italic text-xs">
              हम आपका डेटा कभी किसी को नहीं बेचते या शेयर नहीं करते।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Data Usage</h3>
            <p className="text-gray-600 mb-2">
              Your data is used only to provide TiffinOS services - managing customers, tracking attendance, processing payments, and generating reports.
            </p>
            <p className="text-gray-500 italic text-xs">
              आपका डेटा सिर्फ TiffinOS सर्विस देने के लिए इस्तेमाल होता है।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">5. Data Deletion</h3>
            <p className="text-gray-600 mb-2">
              You can delete customers anytime. Deleted data goes to Recycle Bin and can be permanently removed. To delete your entire account, contact us on WhatsApp.
            </p>
            <p className="text-gray-500 italic text-xs">
              आप कभी भी कस्टमर डिलीट कर सकते हैं। अकाउंट डिलीट करने के लिए WhatsApp करें।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">6. Cookies & Storage</h3>
            <p className="text-gray-600 mb-2">
              We use local storage to save your preferences and session information. No tracking cookies are used.
            </p>
            <p className="text-gray-500 italic text-xs">
              हम सिर्फ सेशन और प्रेफरेंस के लिए लोकल स्टोरेज इस्तेमाल करते हैं।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">7. Contact</h3>
            <p className="text-gray-600">
              For privacy concerns or questions:<br />
              📱 WhatsApp: +91 92719 81229<br />
              📧 Email: support@tiffinos.com
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-blue-800 text-xs font-medium">
              Last Updated: December 2025
            </p>
          </div>

        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
          >
            Close / बंद करें
          </button>
        </div>
      </div>
    </div>
  )
}
