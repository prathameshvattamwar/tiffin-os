import { X } from 'lucide-react'

interface TermsConditionsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept?: () => void
}

export default function TermsConditionsModal({ isOpen, onClose, onAccept }: TermsConditionsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Terms & Conditions</h2>
            <p className="text-sm text-gray-500">नियम और शर्तें</p>
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
            <h3 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
            <p className="text-gray-600 mb-2">
              By using TiffinOS, you agree to these Terms & Conditions. If you do not agree, please do not use the app.
            </p>
            <p className="text-gray-500 italic text-xs">
              TiffinOS का उपयोग करके, आप इन नियमों और शर्तों से सहमत होते हैं।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Service Description</h3>
            <p className="text-gray-600 mb-2">
              TiffinOS is a business management app for tiffin/mess service providers to manage customers, attendance, payments, and generate reports.
            </p>
            <p className="text-gray-500 italic text-xs">
              TiffinOS टिफिन/मेस सर्विस के लिए बिज़नेस मैनेजमेंट ऐप है।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. User Responsibilities</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mb-2">
              <li>Provide accurate business and customer information</li>
              <li>Keep your login credentials secure</li>
              <li>Use the app only for lawful business purposes</li>
              <li>Do not misuse or attempt to hack the platform</li>
            </ul>
            <p className="text-gray-500 italic text-xs">
              सही जानकारी दें, लॉगिन सुरक्षित रखें।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Subscription & Payments</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mb-2">
              <li>Free Trial: 30 days with limited features (20 customers)</li>
              <li>Paid Plans: Starter (₹299/month), Pro (₹449/month)</li>
              <li>Payments are non-refundable once processed</li>
            </ul>
            <p className="text-gray-500 italic text-xs">
              Free Trial 30 दिन का है। पेड प्लान की पेमेंट refundable नहीं है।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">5. Data & Privacy</h3>
            <p className="text-gray-600 mb-2">
              Your data is stored securely and not shared with third parties. See our Privacy Policy for details.
            </p>
            <p className="text-gray-500 italic text-xs">
              आपका डेटा सुरक्षित है और किसी को शेयर नहीं किया जाता।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">6. Service Availability</h3>
            <p className="text-gray-600 mb-2">
              We strive to keep TiffinOS available 24/7, but we do not guarantee uninterrupted service.
            </p>
            <p className="text-gray-500 italic text-xs">
              हम 24/7 सर्विस देने की कोशिश करते हैं।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">7. Limitation of Liability</h3>
            <p className="text-gray-600 mb-2">
              TiffinOS is provided "as is". We are not liable for any business losses arising from use of the app.
            </p>
            <p className="text-gray-500 italic text-xs">
              ऐप के इस्तेमाल से होने वाले किसी भी बिज़नेस loss के लिए हम ज़िम्मेदार नहीं हैं।
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">8. Contact</h3>
            <p className="text-gray-600">
              📱 WhatsApp: +91 92719 81229<br />
              📧 Email: support@tiffinos.com
            </p>
          </div>

          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
            <p className="text-orange-800 text-xs font-medium">
              Last Updated: December 2025
            </p>
          </div>

        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <button
            onClick={onAccept || onClose}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold"
          >
            {onAccept ? 'I Accept / मैं सहमत हूँ' : 'Close / बंद करें'}
          </button>
        </div>
      </div>
    </div>
  )
}
