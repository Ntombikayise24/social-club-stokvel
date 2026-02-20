import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentAPI } from '../../services/api';

const PaymentVerification: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');
    const [transactionId, setTransactionId] = useState<string | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const reference = searchParams.get('reference');

                if (!reference) {
                    setStatus('failed');
                    setMessage('No payment reference found');
                    return;
                }

                // Verify payment with backend
                const response = await PaymentAPI.verifyPayment({
                    reference: reference,
                });

                if (response.success) {
                    setStatus('success');
                    setMessage('Payment verified successfully! Your contribution has been recorded.');
                    setTransactionId(response.data?.transaction_id?.toString() || null);
                    
                    // Show success toast
                    toast.success('Payment completed successfully!');

                    // Redirect to dashboard after 3 seconds
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 3000);
                } else {
                    setStatus('failed');
                    setMessage(response.message || 'Payment verification failed');
                    toast.error(response.message || 'Payment verification failed');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('failed');
                setMessage('Error verifying payment');
                toast.error('Error verifying payment');
            }
        };

        verifyPayment();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        {transactionId && (
                            <p className="text-xs text-gray-500 mb-6">
                                Transaction ID: {transactionId}
                            </p>
                        )}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800">
                                ✅ Your contribution has been recorded and will be reflected in your account shortly.
                            </p>
                        </div>
                        <p className="text-gray-500 text-sm mt-6">
                            Redirecting to dashboard in 3 seconds...
                        </p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800">
                                ❌ Your payment could not be processed. Please try again or contact support.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentVerification;
