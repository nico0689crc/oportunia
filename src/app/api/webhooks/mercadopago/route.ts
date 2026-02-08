import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('[MP Webhook] Received notification:', JSON.stringify(body, null, 2));

        // Mercado Pago sends notifications with this structure
        const { type, data } = body;

        // We only care about payment notifications
        if (type === 'payment') {
            const paymentId = data.id;

            console.log('[MP Webhook] Processing payment notification:', paymentId);

            // Fetch payment details from Mercado Pago
            const { getValidMPToken } = await import('@/lib/mercadopago/admin-auth');
            const accessToken = await getValidMPToken();

            const paymentResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!paymentResponse.ok) {
                console.error('[MP Webhook] Failed to fetch payment details');
                return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
            }

            const payment = await paymentResponse.json();

            console.log('[MP Webhook] Payment details:', {
                id: payment.id,
                status: payment.status,
                external_reference: payment.external_reference,
            });

            // Check if this is a subscription payment
            const externalRef = payment.external_reference;
            if (externalRef && externalRef.includes('subscription')) {
                const [userId, planTier] = externalRef.split('|');

                console.log('[MP Webhook] Subscription payment detected:', { userId, planTier, status: payment.status });

                // Only update if payment is approved
                if (payment.status === 'approved') {
                    // Calculate next renewal date (30 days from now)
                    const nextRenewal = new Date();
                    nextRenewal.setDate(nextRenewal.getDate() + 30);

                    const { error } = await supabaseAdmin
                        .from('subscriptions')
                        .upsert({
                            user_id: userId,
                            tier: planTier,
                            status: 'active',
                            mp_subscription_id: payment.id.toString(),
                            next_renewal_date: nextRenewal.toISOString(),
                            last_payment_id: payment.id.toString(),
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'user_id' });

                    if (error) {
                        console.error('[MP Webhook] Error updating subscription:', error);
                        return NextResponse.json({ error: 'Database error' }, { status: 500 });
                    }

                    console.log('[MP Webhook] Subscription activated successfully for user:', userId);
                } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
                    // Update subscription to failed
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: 'failed',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('user_id', userId);

                    console.log('[MP Webhook] Subscription payment failed for user:', userId);
                }
            }
        }

        // Always return 200 to acknowledge receipt
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[MP Webhook] Error processing webhook:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// GET endpoint for webhook verification (Mercado Pago sometimes sends GET requests)
export async function GET() {
    return NextResponse.json({ status: 'ok' });
}
