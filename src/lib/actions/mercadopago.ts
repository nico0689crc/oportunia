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

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const backUrl = `${appUrl}/dashboard?subscription=success`;

        // Mercado Pago rechaza URLs de localhost, solo enviamos back_url en producción
        const isProduction = appUrl.startsWith('https://');

        console.log('[MP Preference] App URL:', appUrl, 'Is Production:', isProduction);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const preferenceBody: Record<string, any> = {
            reason: `Oportunia - Plan ${plan.name}`,
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: plan.price,
                currency_id: 'ARS',
            },
            external_reference: `${userId}|${plan.tier}`,
            payer_email: payerEmail,
            status: 'pending',
        };

        // Solo agregamos back_url si estamos en producción
        if (isProduction) {
            preferenceBody.back_url = backUrl;
            console.log('[MP Preference] Including back_url:', backUrl);
        } else {
            console.log('[MP Preference] Skipping back_url (localhost not supported by MP)');
        }

        const result = await preapproval.create({ body: preferenceBody });

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error creating MP subscription:', error);

        let errorMessage = 'Error desconocido';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        if (error?.response) {
            console.error('MP API Error Response:', JSON.stringify(error.response, null, 2));
            errorMessage += ` (API: ${JSON.stringify(error.response.data || error.response)})`;
        } else if (error?.cause) {
            console.error('MP API Error Cause:', JSON.stringify(error.cause, null, 2));
        }

        throw new Error('Error al iniciar el proceso de suscripción: ' + errorMessage);
    }
}
