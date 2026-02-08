import { NextRequest, NextResponse } from 'next/server';
import { getValidMPToken } from '@/lib/mercadopago/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const paymentId = searchParams.get('payment_id');

        console.log('[Payment Check API] Received request for payment_id:', paymentId);

        if (!paymentId) {
            console.error('[Payment Check API] Missing payment_id');
            return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
        }

        // Get MP access token
        let mpAccessToken: string;
        try {
            mpAccessToken = await getValidMPToken();
            console.log('[Payment Check API] Got MP access token');
        } catch (tokenError) {
            console.error('[Payment Check API] Failed to get MP token:', tokenError);
            return NextResponse.json({
                error: 'Failed to get access token',
                details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
            }, { status: 500 });
        }

        // Query payment from Mercado Pago
        console.log('[Payment Check API] Fetching payment from MP...');
        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${mpAccessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error('[Payment Check API] MP API error:', {
                status: response.status,
                statusText: response.statusText
            });

            // If payment not found, it might be a preference_id instead
            if (response.status === 404) {
                console.log('[Payment Check API] Payment not found, might be preference_id');
                return NextResponse.json({
                    error: 'Payment not found',
                    status: 'pending',
                    note: 'Payment might still be processing'
                }, { status: 200 });
            }

            return NextResponse.json({
                error: 'Failed to fetch payment from MP',
                status: response.status
            }, { status: response.status });
        }

        const payment = await response.json();

        console.log('[Payment Check API] Payment details:', {
            id: payment.id,
            status: payment.status,
            external_reference: payment.external_reference,
        });

        // If payment is approved, update subscription
        if (payment.status === 'approved') {
            console.log('[Payment Check API] Payment approved, updating subscription...');

            const externalRef = payment.external_reference;
            if (externalRef && externalRef.includes('|')) {
                const parts = externalRef.split('|');
                const userId = parts[0];
                const tier = parts[1];

                console.log('[Payment Check API] Extracted from external_reference:', { userId, tier });

                // Calculate next renewal date (30 days from now)
                const nextRenewal = new Date();
                nextRenewal.setDate(nextRenewal.getDate() + 30);

                const { error } = await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        tier,
                        status: 'active',
                        mp_subscription_id: payment.id.toString(),
                        next_renewal_date: nextRenewal.toISOString(),
                        last_payment_id: payment.id.toString(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error('[Payment Check API] Error updating subscription:', error);
                    return NextResponse.json({
                        error: 'Database error',
                        status: payment.status,
                        payment_id: payment.id,
                    }, { status: 500 });
                }

                console.log('[Payment Check API] Subscription activated successfully for user:', userId);
            } else {
                console.warn('[Payment Check API] Invalid external_reference format:', externalRef);
            }
        }

        return NextResponse.json({
            status: payment.status,
            payment_id: payment.id,
            external_reference: payment.external_reference,
        });
    } catch (error) {
        console.error('[Payment Check API] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
