'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function PaymentSuccessClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando tu pago...');
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        // Get payment_id from URL - MP uses different parameter names
        const paymentId = searchParams.get('payment_id') ||
            searchParams.get('collection_id') ||
            searchParams.get('preference_id');

        const collectionStatus = searchParams.get('collection_status');
        const paymentStatus = searchParams.get('status');

        console.log('[Payment Success] URL params:', {
            paymentId,
            collectionStatus,
            paymentStatus,
            allParams: Object.fromEntries(searchParams.entries())
        });

        if (!paymentId) {
            console.error('[Payment Success] No payment ID found in URL');
            setStatus('error');
            setMessage('No se encontró información del pago');
            return;
        }

        // If MP already tells us it's approved, we can skip some polling
        if (collectionStatus === 'approved' || paymentStatus === 'approved') {
            setMessage('Pago aprobado, activando suscripción...');
        }

        let pollCount = 0;
        const maxPolls = 30; // 30 attempts * 2 seconds = 1 minute max

        // Polling: check payment status
        const checkPayment = async () => {
            pollCount++;
            setAttempts(pollCount);

            try {
                console.log(`[Payment Success] Checking payment (attempt ${pollCount}/${maxPolls})...`);

                const response = await fetch(`/api/payments/check?payment_id=${paymentId}`);
                const data = await response.json();

                console.log('[Payment Success] Response:', data);

                if (data.status === 'approved') {
                    console.log('[Payment Success] Payment approved!');
                    setStatus('success');
                    setMessage('¡Pago exitoso! Tu suscripción ha sido activada.');

                    // Redirect to dashboard after 3 seconds
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 3000);
                } else if (data.status === 'pending' || data.status === 'in_process') {
                    console.log('[Payment Success] Payment still pending...');
                    setMessage(`Verificando pago... (intento ${pollCount}/${maxPolls})`);

                    // Continue polling if we haven't exceeded max attempts
                    if (pollCount < maxPolls) {
                        setTimeout(checkPayment, 2000); // Check again in 2 seconds
                    } else {
                        console.warn('[Payment Success] Max polling attempts reached');
                        setStatus('error');
                        setMessage('El pago está pendiente. Por favor, verifica tu email o revisa tu cuenta de Mercado Pago.');
                    }
                } else if (data.status === 'rejected' || data.status === 'cancelled') {
                    console.error('[Payment Success] Payment rejected/cancelled');
                    setStatus('error');
                    setMessage('El pago fue rechazado o cancelado.');
                } else {
                    console.warn('[Payment Success] Unknown payment status:', data.status);
                    setMessage(`Estado del pago: ${data.status}. Verificando...`);

                    if (pollCount < maxPolls) {
                        setTimeout(checkPayment, 2000);
                    } else {
                        setStatus('error');
                        setMessage('No pudimos verificar el estado del pago. Por favor, contacta soporte.');
                    }
                }
            } catch (error) {
                console.error('[Payment Success] Error checking payment:', error);

                // Retry on error if we haven't exceeded max attempts
                if (pollCount < maxPolls) {
                    setMessage(`Error al verificar. Reintentando... (${pollCount}/${maxPolls})`);
                    setTimeout(checkPayment, 3000); // Wait a bit longer on error
                } else {
                    setStatus('error');
                    setMessage('Error al verificar el pago. Por favor, contacta soporte.');
                }
            }
        };

        // Start checking immediately
        checkPayment();
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    {status === 'loading' && (
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Verificando tu pago
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {message}
                            </p>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Intento {attempts} - Esto puede tomar unos segundos...
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                                ¡Pago exitoso!
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {message}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Redirigiendo al dashboard...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <XCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                                Problema con el pago
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {message}
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/dashboard/pricing')}
                                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Intentar nuevamente
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                                >
                                    Volver al dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
