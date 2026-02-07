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
            // 1. Consultar el pago en la API de Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: {
                    Authorization: `Bearer ${mpAccessToken}`,
                },
            })

            if (!response.ok) throw new Error('Error consultando pago en MP')

            const paymentData = await response.json()

            // 2. Si el pago está aprobado, actualizar la suscripción
            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference // Asumimos que mandamos el Clerk ID aquí
                const planTier = paymentData.metadata?.plan_tier || 'pro' // O sacarlo del item/metadata

                const { error } = await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        tier: planTier,
                        status: 'active',
                        mp_subscription_id: id
                    })

                if (error) throw error
                console.log(`Suscripción actualizada para usuario ${userId}: ${planTier}`)
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
