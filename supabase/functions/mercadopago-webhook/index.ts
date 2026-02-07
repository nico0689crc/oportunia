import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
 * Gets a valid MP Access Token from the DB
 */
async function getAdminToken(): Promise<string> {
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'ml_auth_tokens')
        .single();

    if (error || !data) throw new Error('Admin tokens not found in DB');

    const encryptedToken = data.value.access_token;
    if (!encryptionKey) throw new Error('ENCRYPTION_KEY not set in Edge Function secrets');

    return await decrypt(encryptedToken, encryptionKey);
}

serve(async (req) => {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type')
        const id = searchParams.get('data.id') || searchParams.get('id')

        console.log(`Recibido webhook de MP: tipo=${type}, id=${id}`)

        if ((type === 'payment' || type === 'preapproval') && id) {
            const mpAccessToken = await getAdminToken();
            const endpoint = type === 'payment' ? 'payments' : 'preapproval';

            const response = await fetch(`https://api.mercadopago.com/v1/${endpoint}/${id}`, {
                headers: { Authorization: `Bearer ${mpAccessToken}` }
            });

            if (!response.ok) throw new Error(`Error consultando ${type} en MP: ${response.statusText}`);

            const data = await response.json();

            if (type === 'payment') {
                if (data.status === 'approved') {
                    await supabase.from('subscriptions').upsert({
                        user_id: data.external_reference,
                        tier: data.metadata?.plan_tier || 'pro',
                        status: 'active'
                    });
                }
            } else {
                // Suscripción recurrente (preapproval)
                const statusMap: Record<string, string> = {
                    authorized: 'active',
                    paused: 'past_due',
                    cancelled: 'canceled'
                };

                const userId = data.external_reference;
                const status = statusMap[data.status] || 'inactive';
                let tier = 'pro';
                if (data.reason.toLowerCase().includes('elite')) tier = 'elite';

                if (userId) {
                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        tier: tier,
                        status: status,
                        mp_subscription_id: id
                    });
                    console.log(`Suscripción recurrente actualizada para ${userId}: ${status} (${tier})`);
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error en webhook:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
