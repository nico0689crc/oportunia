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

        const externalRefFromQuery = searchParams.get('external_reference');

        // Determine if it's a preapproval or a payment
        // Subscription IDs usually start with 'pre' or are long numeric but different
        const isPreapproval = paymentId.toString().startsWith('pre') || paymentId.length > 20;
        const endpoint = isPreapproval ? `preapproval/${paymentId}` : `v1/payments/${paymentId}`;

        console.log(`[Payment Check API] Fetching from MP endpoint: ${endpoint}`);
        const response = await fetch(
            `https://api.mercadopago.com/${endpoint}`,
            {
                headers: {
                    'Authorization': `Bearer ${mpAccessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error('[Payment Check API] MP API error:', {
                status: response.status,
                endpoint
            });

            return NextResponse.json({
                error: 'Object not found or API error',
                status: 'pending',
                note: 'Might still be processing'
            }, { status: 200 });
        }

        const mpObject = await response.json();

        // Standardize status and external_reference across different MP objects
        const status = mpObject.status;
        const externalRef = mpObject.external_reference || externalRefFromQuery;
        const finalId = mpObject.id;
        const nextBillingDate = mpObject.next_payment_date || mpObject.auto_recurring?.next_payment_date;

        console.log('[Payment Check API] Resolved details:', {
            id: finalId,
            status,
            nextBillingDate,
            external_reference: externalRef,
        });

        // If payment/preapproval is approved or authorized, update subscription
        if (status === 'approved' || status === 'authorized') {
            console.log(`[Payment Check API] Status ${status} confirmed, updating subscription...`);

            // ... (existing candidates logic)
            let userIdCandidate = null;
            let tierCandidate = 'pro'; // Default

            if (externalRef && externalRef.includes('|')) {
                const parts = externalRef.split('|');
                userIdCandidate = parts[0];
                tierCandidate = parts[1];
            } else {
                userIdCandidate = searchParams.get('user_id');
            }

            if (userIdCandidate) {
                const { error } = await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        user_id: userIdCandidate,
                        tier: tierCandidate,
                        status: 'active',
                        subscription_status: status,
                        preapproval_id: isPreapproval ? finalId : undefined,
                        next_billing_date: nextBillingDate,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error('[Payment Check API] Error updating subscription:', error);
                    return NextResponse.json({
                        error: 'Database error',
                        status: status,
                        id: finalId,
                    }, { status: 500 });
                }

                console.log('[Payment Check API] Subscription activated successfully for user:', userIdCandidate);
            } else {
                console.warn('[Payment Check API] Could not identify user for activation');
            }
        }

        return NextResponse.json({
            status: status,
            id: finalId,
            external_reference: externalRef,
        });
    } catch (error) {
        console.error('[Payment Check API] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
