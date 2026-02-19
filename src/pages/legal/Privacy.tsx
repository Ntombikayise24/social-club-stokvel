import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, Clock } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/register" className="text-gray-600 hover:text-primary-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: 19 February 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary-600" />
                1. Information We Collect
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Personal information (name, email, phone number, ID number)</li>
                <li>Financial information (contributions, loans, payment history)</li>
                <li>Account activity (login history, profile switches, group participation)</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-primary-600" />
                2. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>To provide and maintain our services</li>
                <li>To process contributions and loans</li>
                <li>To communicate with you about your account</li>
                <li>To ensure group transparency (transaction history visible to members)</li>
                <li>To improve and personalize your experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-primary-600" />
                3. Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure payment processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary-600" />
                4. Data Sharing and Transparency
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Within your stokvel groups, certain information is visible to all members:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Contribution history (amounts and dates)</li>
                <li>Loan status (active/overdue/repaid)</li>
                <li>Member names and join dates</li>
              </ul>
              <p className="text-gray-600 mt-3">
                This transparency is essential for trust and accountability in group savings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-600" />
                5. Data Retention
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your information for as long as your account is active and as needed to 
                provide our services. You may request deletion of your account, which will remove 
                your personal information in accordance with our data retention policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary-600" />
                6. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">Email: privacy@hennessysocialclub.co.za</p>
                <p className="text-gray-700">Phone: 0800 123 456</p>
                <p className="text-gray-700">Address: 123 Stokvel Street, Johannesburg, South Africa</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By using HENNESSY SOCIAL CLUB, you consent to this Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}