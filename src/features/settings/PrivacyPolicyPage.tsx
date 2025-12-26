import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Database, Trash2, Mail } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Privacy & Security</h1>
            <p className="text-sm text-gray-500">गोपनीयता और सुरक्षा</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-lg font-bold">Your Data is Safe</h2>
              <p className="text-blue-100 text-sm">आपका डेटा सुरक्षित है</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Data We Collect</h3>
              <p className="text-xs text-gray-500">हम कौन सा डेटा लेते हैं</p>
            </div>
          </div>
          <div className="p-4 text-sm">
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Your business name and contact details</li>
              <li>Customer names and mobile numbers</li>
              <li>Attendance and payment records</li>
            </ul>
            <p className="text-gray-500 italic text-xs mt-2">
              हम सिर्फ वही जानकारी लेते हैं जो आपके टिफिन बिज़नेस के लिए ज़रूरी है।
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">How We Protect Your Data</h3>
              <p className="text-xs text-gray-500">हम आपके डेटा की सुरक्षा कैसे करते हैं</p>
            </div>
          </div>
          <div className="p-4 text-sm">
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>All data is encrypted during transfer and storage</li>
              <li>Only you can access your business data</li>
              <li>We never sell or share your data with third parties</li>
            </ul>
            <p className="text-gray-500 italic text-xs mt-2">
              आपका डेटा एन्क्रिप्टेड है। हम कभी भी आपका डेटा किसी को नहीं बेचते।
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Data Deletion</h3>
              <p className="text-xs text-gray-500">डेटा हटाना</p>
            </div>
          </div>
          <div className="p-4 text-sm">
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>You can delete customers anytime (goes to Recycle Bin)</li>
              <li>To delete your entire account, contact us on WhatsApp</li>
            </ul>
            <p className="text-gray-500 italic text-xs mt-2">
              आप कभी भी कस्टमर डिलीट कर सकते हैं। पूरा अकाउंट डिलीट करने के लिए WhatsApp पर संपर्क करें।
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Contact Us</h3>
              <p className="text-xs text-gray-500">संपर्क करें</p>
            </div>
          </div>
          <div className="p-4 text-sm">
            <p className="text-gray-600">📱 WhatsApp: +91 92719 81229</p>
            <p className="text-gray-600">📧 Email: support@tiffinos.com</p>
          </div>
        </div>

        <button
          onClick={() => window.open('https://wa.me/919271981229?text=Hi! I have a question about privacy.', '_blank')}
          className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold"
        >
          �� Contact on WhatsApp
        </button>

      </div>
    </div>
  )
}
