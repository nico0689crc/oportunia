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
 * Gets a valid MP Access Token from environment variables
 * For test mode, uses MP_TEST_ACCESS_TOKEN
 * For production mode, uses encrypted MP_PROD_ACCESS_TOKEN with ENCRYPTION_KEY
 */
async function getMPAccessToken(): Promise<string> {
    console.log('[MP Webhook] Starting getMPAccessToken...');

    // Check if we have a test token (unencrypted, for sandbox)
    const testToken = Deno.env.get('MP_TEST_ACCESS_TOKEN');
    console.log('[MP Webhook] Test token exists:', !!testToken);
    console.log('[MP Webhook] Test token length:', testToken?.length || 0);

    if (testToken) {
        console.log('[MP Webhook] Using test access token');
        return testToken;
    }

    console.log('[MP Webhook] No test token, checking production token...');

    // Production mode: get encrypted token
    const encryptedToken = Deno.env.get('MP_PROD_ACCESS_TOKEN');
    console.log('[MP Webhook] Encrypted token exists:', !!encryptedToken);

    if (!encryptedToken) {
        const error = 'No MP access token configured. Set either MP_TEST_ACCESS_TOKEN or MP_PROD_ACCESS_TOKEN';
        console.error('[MP Webhook] ERROR:', error);
        throw new Error(error);
    }

    if (!encryptionKey) {
        const error = 'ENCRYPTION_KEY not set in Edge Function secrets';
        console.error('[MP Webhook] ERROR:', error);
        throw new Error(error);
    }

    console.log('[MP Webhook] Using production access token (encrypted)');
    return await decrypt(encryptedToken, encryptionKey);
}

serve(async (req) => {
    try {
        console.log('[MP Webhook] Incoming request:', {
            method: req.method,
            url: req.url,
            headers: Object.fromEntries(req.headers.entries())
        });

        // Get signature headers for validation
        const xSignature = req.headers.get('x-signature');
        const xRequestId = req.headers.get('x-request-id');

        console.log('[MP Webhook] Signature headers:', {
            xSignature: xSignature ? 'present' : 'missing',
            xRequestId: xRequestId ? 'present' : 'missing'
        });

        // Mercado Pago can send webhooks as query params OR JSON body
        const url = new URL(req.url);
        let type: string | null = null;
        let paymentId: string | null = null;

        // Try to get from query params first (test webhooks)
        type = url.searchParams.get('type');
        paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

        console.log('[MP Webhook] Query params:', { type, paymentId });

        // If not in query params, try JSON body (real webhooks)
        if (!type || !paymentId) {
            try {
                const body = await req.json();
                console.log('[MP Webhook] JSON body:', body);
                type = body.type;
                paymentId = body.data?.id || body.id;
            } catch (e) {
                console.log('[MP Webhook] No JSON body, using query params only');
            }
        }

        console.log('[MP Webhook] Parsed notification:', { type, paymentId });

        // Validate signature if present (production webhooks)
        if (xSignature && xRequestId && paymentId) {
            console.log('[MP Webhook] Validating signature...');

            // Get the secret from environment
            const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');

            if (webhookSecret) {
                try {
                    // Parse signature header: ts=timestamp,v1=hash
                    const parts = xSignature.split(',');
                    const tsMatch = parts.find(p => p.startsWith('ts='));
                    const v1Match = parts.find(p => p.startsWith('v1='));

                    if (tsMatch && v1Match) {
                        const timestamp = tsMatch.split('=')[1];
                        const receivedHash = v1Match.split('=')[1];

                        // Create the manifest: id + request-id + timestamp
                        const manifest = `id:${paymentId};request-id:${xRequestId};ts:${timestamp};`;

                        console.log('[MP Webhook] Signature manifest:', manifest);

                        // Generate HMAC SHA256
                        const encoder = new TextEncoder();
                        const keyData = encoder.encode(webhookSecret);
                        const messageData = encoder.encode(manifest);

                        const cryptoKey = await crypto.subtle.importKey(
                            'raw',
                            keyData,
                            { name: 'HMAC', hash: 'SHA-256' },
                            false,
                            ['sign']
                        );

                        const signature = await crypto.subtle.sign(
                            'HMAC',
                            cryptoKey,
                            messageData
                        );

                        // Convert to hex
                        const hashArray = Array.from(new Uint8Array(signature));
                        const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                        console.log('[MP Webhook] Calculated hash:', calculatedHash);
                        console.log('[MP Webhook] Received hash:', receivedHash);

                        if (calculatedHash !== receivedHash) {
                            console.error('[MP Webhook] Invalid signature!');
                            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                                headers: { 'Content-Type': 'application/json' },
                                status: 401,
                            });
                        }

                        console.log('[MP Webhook] Signature validated successfully');
                    }
                } catch (signatureError) {
                    console.error('[MP Webhook] Error validating signature:', signatureError);
                    // Continue processing even if signature validation fails (for now)
                }
            } else {
                console.log('[MP Webhook] No webhook secret configured, skipping signature validation');
            }
        }

        // We only care about payment notifications for Checkout Pro
        if (type === 'payment' && paymentId) {
            console.log('[MP Webhook] Processing payment notification:', paymentId);

            // Get MP access token from database
            let mpAccessToken: string;
            try {
                mpAccessToken = await getMPAccessToken();
                console.log('[MP Webhook] Successfully obtained MP access token');
            } catch (tokenError) {
                console.error('[MP Webhook] Failed to get access token:', tokenError);
                return new Response(JSON.stringify({
                    error: 'Failed to get access token',
                    details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
                }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 401,
                });
            }

            // Fetch payment details from Mercado Pago
            const paymentResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${mpAccessToken}`,
                    },
                }
            );

            if (!paymentResponse.ok) {
                console.error('[MP Webhook] Failed to fetch payment details:', {
                    status: paymentResponse.status,
                    statusText: paymentResponse.statusText,
                    paymentId
                });

                // Return 200 to acknowledge receipt (MP test uses fake payment IDs)
                return new Response(JSON.stringify({
                    received: true,
                    note: 'Payment not found, likely a test notification'
                }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            const payment = await paymentResponse.json();

            console.log('[MP Webhook] Payment details:', {
                id: payment.id,
                status: payment.status,
                external_reference: payment.external_reference,
                metadata: payment.metadata,
            });

            // Check if this is a subscription payment
            const externalRef = payment.external_reference;
            if (externalRef && externalRef.includes('subscription')) {
                const parts = externalRef.split('|');
                const userId = parts[0];
                const planTier = parts[1];

                console.log('[MP Webhook] Subscription payment detected:', {
                    userId,
                    planTier,
                    status: payment.status
                });

                // Only update if payment is approved
                if (payment.status === 'approved') {
                    // Calculate next renewal date (30 days from now)
                    const nextRenewal = new Date();
                    nextRenewal.setDate(nextRenewal.getDate() + 30);

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
                        }, { onConflict: 'user_id' });

                    if (error) {
                        console.error('[MP Webhook] Error updating subscription:', error);
                        return new Response(JSON.stringify({ error: 'Database error' }), {
                            headers: { 'Content-Type': 'application/json' },
                            status: 200,
                        });
                    }

                    console.log('[MP Webhook] Subscription activated successfully for user:', userId);
                } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
                    // Update subscription to failed
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'failed',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('user_id', userId);

                    console.log('[MP Webhook] Subscription payment failed for user:', userId);
                } else {
                    console.log('[MP Webhook] Payment status not final:', payment.status);
                }
            } else {
                console.log('[MP Webhook] Not a subscription payment, ignoring');
            }
        } else {
            console.log('[MP Webhook] Ignoring non-payment notification:', type);
        }

        // Always return 200 to acknowledge receipt
        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[MP Webhook] Error processing webhook:', errorMessage);
        if (error instanceof Error && error.stack) {
            console.error('[MP Webhook] Stack trace:', error.stack);
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200, // Return 200 to prevent retries
        });
    }
})
