import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string

serve(async (req) => {
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    let event

    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret)
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    /* 
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    */

    // Manejar el evento
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object
            // Lógica para marcar suscripción como activa
            console.log('Payment successful for session:', session.id)
            break
        default:
            console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    })
})
