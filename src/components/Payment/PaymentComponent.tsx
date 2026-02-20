import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import { PaymentAPI } from '../../services/api';

// Install @paystack/inline-js for this to work
// npm install @paystack/inline-js

declare global {
    interface Window {
        PaystackPop: any;
    }
}

const paymentSchema = z.object({
    membershipId: z.number().min(1, 'Please select a membership'),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    email: z.string().email('Please enter a valid email'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentComponentProps {
    memberships: any[];
}

const PaymentComponent: React.FC<PaymentComponentProps> = ({ memberships }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentInitialized, setPaymentInitialized] = useState(false);
    const [currentTransactionId, setCurrentTransactionId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
    });

    const onSubmit = async (data: PaymentFormData) => {
        try {
            setIsLoading(true);

            // Initialize payment with backend
            const response = await PaymentAPI.initializePayment({
                membershipId: data.membershipId,
                amount: data.amount,
                email: data.email,
            });

            if (!response.data.success || !response.data.data) {
                toast.error(response.data.message || 'Failed to initialize payment');
                return;
            }

            const { authorization_url } = response.data.data;
            setCurrentTransactionId(response.data.data.transaction_id);
            setPaymentInitialized(true);

            // Redirect to Paystack payment page
            window.location.href = authorization_url;
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Error initializing payment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Make a Contribution</h2>
                <p className="text-gray-600 text-sm mt-2">Pay securely using Paystack</p>
            </div>

            {paymentInitialized ? (
                <div className="text-center py-8">
                    <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <p className="text-gray-700">
                        Redirecting to payment page...
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Transaction ID: {currentTransactionId}
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Membership Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Membership
                        </label>
                        <select
                            {...register('membershipId', {
                                valueAsNumber: true,
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Choose a membership</option>
                            {memberships?.map((membership) => (
                                <option key={membership.id} value={membership.id}>
                                    {membership.stokvel_name} - Target: R{membership.target_amount.toFixed(2)}
                                </option>
                            ))}
                        </select>
                        {errors.membershipId && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.membershipId.message}
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (R)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', {
                                valueAsNumber: true,
                            })}
                            placeholder="Enter amount"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.amount && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.amount.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            {...register('email')}
                            placeholder="your@email.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Security Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                            ✅ Your payment is secure and encrypted. You'll be redirected to Paystack for payment processing.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Continue to Payment'
                        )}
                    </button>

                    {/* Info */}
                    <p className="text-center text-xs text-gray-500">
                        All transactions powered by{' '}
                        <span className="font-semibold">Paystack</span>
                    </p>
                </form>
            )}
        </div>
    );
};

export default PaymentComponent;
