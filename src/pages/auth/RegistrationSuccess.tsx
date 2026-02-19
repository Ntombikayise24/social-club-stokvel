import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Mail } from 'lucide-react';

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Registration Successful!
        </h2>
        
        <p className="text-center text-gray-600 mb-6">
          Thank you for joining HENNESSY SOCIAL CLUB
        </p>

        {/* Info Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">Pending Approval</h3>
              <p className="text-sm text-yellow-700">
                Your account is waiting for admin approval. You'll be able to log in once your account is activated.
              </p>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-medium text-gray-800 mb-4">What happens next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-600 font-medium">1</span>
              </div>
              <span className="text-sm text-gray-600">An admin will review your registration</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-600 font-medium">2</span>
              </div>
              <span className="text-sm text-gray-600">You'll be assigned to your chosen stokvel</span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-600 font-medium">3</span>
              </div>
              <span className="text-sm text-gray-600">You'll receive an email when approved</span>
            </li>
          </ul>
        </div>

        {/* Email notice */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
          <Mail className="w-4 h-4" />
          <span>Check your email for updates</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Return to Home
          </Link>
          <Link
            to="/login"
            className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Go to Login
          </Link>
        </div>

        {/* Note */}
        <p className="text-xs text-center text-gray-400 mt-6">
          Approval typically takes 24-48 hours
        </p>
      </div>
    </div>
  );
}