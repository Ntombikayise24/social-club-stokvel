import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, Clock, Users, DollarSign, AlertCircle } from 'lucide-react';

export default function Terms() {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Terms and Conditions</h1>
          <p className="text-gray-500 mb-8">Last updated: 19 February 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-primary-600" />
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using HENNESSY SOCIAL CLUB, you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary-600" />
                2. Membership
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                To become a member, you must:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                3. Contributions and Loans
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Contributions:</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Minimum contribution: R100 per transaction</li>
                    <li>Contributions are tracked per stokvel profile</li>
                    <li>Admin confirmation required for cash payments</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Loans:</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Maximum loan amount: 50% of total contributions</li>
                    <li>Interest rate: 30% flat rate</li>
                    <li>Repayment period: 30 days</li>
                    <li>Overdue penalty: Additional 30% (total 60%)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-600" />
                4. Member Responsibilities
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Make timely contributions according to your stokvel's cycle</li>
                <li>Repay loans within the specified 30-day period</li>
                <li>Participate in group voting when required</li>
                <li>Maintain accurate personal information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-primary-600" />
                5. Default and Penalties
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Late contributions may incur a 5% late fee after 7 days grace period</li>
                <li>Overdue loans incur an additional 30% interest</li>
                <li>Repeated defaults may result in membership suspension</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary-600" />
                6. Account Termination
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                HENNESSY SOCIAL CLUB reserves the right to terminate or suspend accounts that violate these terms. 
                Upon termination:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Voluntary exit: 50% of contributions refunded</li>
                <li>Admin deletion: No returns (forfeits all)</li>
                <li>Outstanding loans become immediately due</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              For questions about these terms, please contact support.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}