'use server';

import { auth } from '@clerk/nextjs/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { getValidMPToken } from '@/lib/mercadopago/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function createSubscriptionPreference(plan: {
    name: string;
    price: number;
    tier: string;
}) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        throw new Error('No estás autenticado');
    }

    const payerEmail = (sessionClaims?.email as string) || 'test_user_123@test.com';

    const accessToken = await getValidMPToken();
    const mongoClient = new MercadoPagoConfig({
        accessToken: accessToken,
    });

    const preapproval = new PreApproval(mongoClient);

    try {
        console.log('[MP Preference] Starting creation for:', {
            planName: plan.name,
            planTier: plan.tier,
            userId,
            payerEmail
        });

        const result = await preapproval.create({
            body: {
                reason: `Oportunia - Plan ${plan.name}`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.price,
                    currency_id: 'ARS',
                },
                back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
                external_reference: `${userId}|${plan.tier}`,
                payer_email: payerEmail,
                status: 'pending',
            },
        });

        console.log('[MP Preference] PreApproval created successfully:', result.id);

        // Guardamos el estado pendiente en la base de datos para mostrar el banner
        console.log('[MP Preference] Upserting pending subscription record for:', userId);
        const { error: upsertError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: userId,
                tier: plan.tier,
                status: 'pending',
                mp_subscription_id: result.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (upsertError) {
            console.error('[MP Preference] Error upserting subscription:', upsertError);
        } else {
            console.log('[MP Preference] Subscription upserted successfully');
        }

        return { url: result.init_point };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error creando suscripción MP:', message);
        if (error && typeof error === 'object' && 'response' in error) {
            console.error('MP API Error Details:', error.response);
        }
        throw new Error('Error al iniciar el proceso de suscripción: ' + message);
    }
}

/**
 * Crea una suscripción recurrente mediante Checkout API (Bricks)
 * Recibe el token de la tarjeta generado en el frontend.
 */
export async function createSubscriptionAction(
    plan: { name: string; price: number; tier: string },
    cardTokenId: string
) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        throw new Error('No estás autenticado');
    }

    const payerEmail = (sessionClaims?.email as string) || 'test_user_123@test.com';

    const accessToken = await getValidMPToken();
    const mpClient = new MercadoPagoConfig({
        accessToken: accessToken,
    });

    const preapproval = new PreApproval(mpClient);

    try {
        console.log('Procesando Suscripción API para:', { planName: plan.name, userId, cardTokenId });

        const result = await preapproval.create({
            body: {
                reason: `Oportunia - Plan ${plan.name}`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.price,
                    currency_id: 'ARS',
                },
                back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
                external_reference: `${userId}|${plan.tier}`,
                payer_email: payerEmail,
                card_token_id: cardTokenId,
                status: 'authorized', // Se activa inmediatamente con el token
            },
        });

        console.log('Suscripción API creada exitosamente:', result.id);
        return { success: true, id: result.id };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error en Checkout API Subscription:', message);
        throw new Error('Error al procesar el pago recurrente: ' + message);
    }
}
