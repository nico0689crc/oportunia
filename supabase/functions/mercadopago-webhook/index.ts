import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type')
        const id = searchParams.get('data.id') || searchParams.get('id')

        console.log(`Recibido webhook de MP: tipo=${type}, id=${id}`)

        if (type === 'payment' && id) {
            // (Lógica existente para pagos únicos - opcional mantenerla)
            const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { Authorization: `Bearer ${mpAccessToken}` }
            })
            if (resp.ok) {
                const pd = await resp.json()
                if (pd.status === 'approved') {
                    await supabase.from('subscriptions').upsert({
                        user_id: pd.external_reference,
                        tier: pd.metadata?.plan_tier || 'pro',
                        status: 'active'
                    })
                }
            }
        }

        if (type === 'preapproval' && id) {
            // 1. Consultar la suscripción (Pre-approval)
            const response = await fetch(`https://api.mercadopago.com/v1/preapproval/${id}`, {
                headers: {
                    Authorization: `Bearer ${mpAccessToken}`,
                },
            })

            if (!response.ok) throw new Error('Error consultando suscripción en MP')

            const subData = await response.json()

            // 2. Mapear estado de MP a nuestro sistema
            // authorized -> active
            // paused -> past_due
            // cancelled -> cancelled
            const statusMap: Record<string, string> = {
                authorized: 'active',
                paused: 'past_due',
                cancelled: 'canceled'
            }

            const userId = subData.external_reference
            const status = statusMap[subData.status] || 'inactive'

            // Intentar deducir el tier por el monto o razón si no viene en metadata
            let tier = 'pro'
            if (subData.reason.toLowerCase().includes('elite')) tier = 'elite'

            if (userId) {
                const { error } = await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        tier: tier,
                        status: status,
                        mp_subscription_id: id
                    })

                if (error) throw error
                console.log(`Suscripción recurrente actualizada para ${userId}: ${status} (${tier})`)
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
