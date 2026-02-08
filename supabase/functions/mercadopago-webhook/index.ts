import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Decrypts a string using AES-256-GCM (Deno/Web Crypto compatible)
 */
async function decrypt(hash: string, hexKey: string): Promise<string> {
    const [ivHex, authTagHex, encryptedHex] = hash.split(':');
    const iv = hexToUint8Array(ivHex);
    const authTag = hexToUint8Array(authTagHex);
    const encrypted = hexToUint8Array(encryptedHex);
    const keyBytes = hexToUint8Array(hexKey);

    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        'AES-GCM',
        false,
        ['decrypt']
    );

    const combined = new Uint8Array(encrypted.length + authTag.length);
    combined.set(encrypted);
    combined.set(authTag, encrypted.length);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        combined
    );

    return new TextDecoder().decode(decrypted);
}

function hexToUint8Array(hex: string): Uint8Array {
    const view = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return view;
}

/**
 * Gets a valid MP Access Token from the DB based on mode (test/production)
 */
async function getMPAccessToken(): Promise<string> {
    // Get mode
    const { data: modeData, error: modeError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'mp_mode')
        .single();

    if (modeError || !modeData) {
        throw new Error('mp_mode not found in DB');
    }

    const mode = modeData.value;

    if (mode === 'test') {
        // Test mode: get unencrypted token from mp_test_config
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'mp_test_config')
            .single();

        if (error || !data) {
            throw new Error('mp_test_config not found in DB');
        }

        return data.value.accessToken;
    } else {
        // Production mode: get encrypted token from mp_auth_tokens
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'mp_auth_tokens')
            .single();

        if (error || !data) {
            throw new Error('mp_auth_tokens not found in DB');
        }

        if (!encryptionKey) {
            throw new Error('ENCRYPTION_KEY not set in Edge Function secrets');
        }

        const encryptedToken = data.value.access_token;
        return await decrypt(encryptedToken, encryptionKey);
    }
}

serve(async (req) => {
    try {
        // Mercado Pago sends webhooks as POST with JSON body
        const body = await req.json()
        const { type, data } = body

        console.log('[MP Webhook] Received notification:', JSON.stringify(body, null, 2))

        // We only care about payment notifications for Checkout Pro
        if (type === 'payment' && data?.id) {
            const paymentId = data.id

            console.log('[MP Webhook] Processing payment notification:', paymentId)

            // Get MP access token from database
            const mpAccessToken = await getMPAccessToken()

            // Fetch payment details from Mercado Pago
            const paymentResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${mpAccessToken}`,
                    },
                }
            )

            if (!paymentResponse.ok) {
                console.error('[MP Webhook] Failed to fetch payment details:', paymentResponse.statusText)
                return new Response(JSON.stringify({ error: 'Failed to fetch payment' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200, // Return 200 to acknowledge receipt even on error
                })
            }

            const payment = await paymentResponse.json()

            console.log('[MP Webhook] Payment details:', {
                id: payment.id,
                status: payment.status,
                external_reference: payment.external_reference,
                metadata: payment.metadata,
            })

            // Check if this is a subscription payment
            const externalRef = payment.external_reference
            if (externalRef && externalRef.includes('subscription')) {
                const parts = externalRef.split('|')
                const userId = parts[0]
                const planTier = parts[1]

                console.log('[MP Webhook] Subscription payment detected:', {
                    userId,
                    planTier,
                    status: payment.status
                })

                // Only update if payment is approved
                if (payment.status === 'approved') {
                    // Calculate next renewal date (30 days from now)
                    const nextRenewal = new Date()
                    nextRenewal.setDate(nextRenewal.getDate() + 30)

                    const { error } = await supabase
                        .from('subscriptions')
                        .upsert({
                            user_id: userId,
                            tier: planTier,
                            status: 'active',
                            mp_subscription_id: payment.id.toString(),
                            next_renewal_date: nextRenewal.toISOString(),
                            last_payment_id: payment.id.toString(),
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'user_id' })

                    if (error) {
                        console.error('[MP Webhook] Error updating subscription:', error)
                        return new Response(JSON.stringify({ error: 'Database error' }), {
                            headers: { 'Content-Type': 'application/json' },
                            status: 200,
                        })
                    }

                    console.log('[MP Webhook] Subscription activated successfully for user:', userId)
                } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
                    // Update subscription to failed
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'failed',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('user_id', userId)

                    console.log('[MP Webhook] Subscription payment failed for user:', userId)
                } else {
                    console.log('[MP Webhook] Payment status not final:', payment.status)
                }
            } else {
                console.log('[MP Webhook] Not a subscription payment, ignoring')
            }
        } else {
            console.log('[MP Webhook] Ignoring non-payment notification:', type)
        }

        // Always return 200 to acknowledge receipt
        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[MP Webhook] Error processing webhook:', errorMessage)
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200, // Return 200 to prevent retries
        })
    }
})
