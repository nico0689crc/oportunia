import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function decrypt(hash: string, hexKey: string): Promise<string> {
    const [ivHex, authTagHex, encryptedHex] = hash.split(':');
    const iv = hexToUint8Array(ivHex);
    const authTag = hexToUint8Array(authTagHex);
    const encrypted = hexToUint8Array(encryptedHex);
    const keyBytes = hexToUint8Array(hexKey);

    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    const combined = new Uint8Array(encrypted.length + authTag.length);
    combined.set(encrypted);
    combined.set(authTag, encrypted.length);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
    return new TextDecoder().decode(decrypted);
}

function hexToUint8Array(hex: string): Uint8Array {
    const view = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return view;
}

async function getAdminToken(): Promise<string> {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'ml_auth_tokens').single();
    if (error || !data) throw new Error('Admin tokens not found in DB');
    const encryptedToken = data.value.access_token;
    if (!encryptionKey) throw new Error('ENCRYPTION_KEY not set');
    return await decrypt(encryptedToken, encryptionKey);
}

serve(async (req) => {
    // Enable CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        const { plan, userId, payerEmail, appUrl } = await req.json()

        const mpAccessToken = await getAdminToken()

        // Use mp-redirect edge function as bridge if appUrl is localhost
        const isLocal = appUrl.includes('localhost')
        const bridgeUrl = `${supabaseUrl}/functions/v1/mp-redirect`
        const finalBackUrl = `${appUrl}/dashboard?subscription=success`

        // If local, we use the bridge. If prod, we can use appUrl directly
        const backUrl = isLocal
            ? `${bridgeUrl}?target=${encodeURIComponent(finalBackUrl)}`
            : finalBackUrl

        const response = await fetch('https://api.mercadopago.com/v1/preapproval', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: `Oportunia - Plan ${plan.name}`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.price,
                    currency_id: 'ARS',
                },
                statement_descriptor: "OPORTUNIA",
                external_reference: `${userId}|${plan.tier}`,
                payer_email: payerEmail,
                back_url: backUrl,
                status: 'pending'
            })
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('MP API Error:', result)
            throw new Error(result.message || 'Error creating MP subscription')
        }

        return new Response(JSON.stringify({ url: result.init_point, id: result.id }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 400,
        })
    }
})
