'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getValidMPToken } from '@/lib/mercadopago/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function createSubscriptionPreference(plan: {
    name: string;
    price: number;
    tier: string;
}) {
    // Usamos auth() primero que es más rápido y seguro
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        console.error('[MP Error] No userId found in session');
        throw new Error('No estás autenticado');
    }

    // Intentamos obtener detalles del usuario, pero no bloqueamos si falla
    let userDetails = { firstName: undefined as string | undefined, lastName: undefined as string | undefined };
    try {
        const user = await currentUser();
        if (user) {
            userDetails = { firstName: user.firstName || undefined, lastName: user.lastName || undefined };
        }
    } catch (err) {
        console.warn('[MP Warning] Failed to fetch currentUser details:', err);
    }

    console.log('--- MP DEBUG: Entering createSubscriptionPreference ---');
    console.log('[MP Step] Getting valid MP token...');

    let accessToken: string;
    try {
        accessToken = await getValidMPToken();
        console.log('[MP DEBUG] Active Access Token Prefix:', accessToken ? accessToken.substring(0, 10) + '...' : 'UNDEFINED');
    } catch (tokenError: unknown) {
        console.error('[MP Critical] Failed to get Access Token:', tokenError);
        const errorMessage = tokenError instanceof Error ? tokenError.message : 'Error desconocido';
        throw new Error('Error de configuración de pago (Token): ' + errorMessage);
    }

    // Check if we're in test mode (using mp_mode setting, not token prefix)
    const { getAppSettingsAction } = await import('@/actions/admin');
    const mpMode = await getAppSettingsAction<string>('mp_mode');
    const isTestMode = mpMode === 'test';
    const siteId = process.env.ML_SITE_ID || 'MLA';

    const client = new MercadoPagoConfig({
        accessToken: accessToken,
    });

    const preference = new Preference(client);

    try {
        // In test mode, we use a unique test email to avoid collisions and mismatch
        const testPayerEmail = `test_buyer_${userId.substring(userId.length - 5)}_${siteId.toLowerCase()}@testuser.com`;
        const finalPayerEmail = isTestMode ? testPayerEmail : (sessionClaims?.email as string);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const preferenceBody: Record<string, any> = {
            items: [
                {
                    id: plan.tier,
                    title: `Suscripción Oportunia - Plan ${plan.name}`,
                    description: `Suscripción mensual al plan ${plan.name}`,
                    quantity: 1,
                    unit_price: plan.price,
                    currency_id: siteId === 'MLB' ? 'BRL' : 'ARS',
                }
            ],
            payer: {
                email: finalPayerEmail,
            },
            back_urls: {
                success: `${appUrl}/dashboard/billing/success`,
                failure: `${appUrl}/dashboard/pricing?error=checkout_failed`,
                pending: `${appUrl}/dashboard/billing/success`,
            },
            auto_return: 'approved',
            external_reference: `${userId}|${plan.tier}|subscription`,
            metadata: {
                subscription: true,
                plan_tier: plan.tier,
                user_id: userId,
            },
        };

        // If not in test mode, we can add more specific payer details
        if (!isTestMode && userDetails.firstName && userDetails.lastName) {
            preferenceBody.payer.name = userDetails.firstName;
            preferenceBody.payer.surname = userDetails.lastName;
        }

        console.log('[MP Preference] Final Body:', JSON.stringify(preferenceBody, null, 2));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await preference.create({ body: preferenceBody as any });

        console.log('[MP Preference] Preference created successfully:', result.id);

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
        console.error('=== FULL MP ERROR OBJECT ===');
        console.error(JSON.stringify(error, null, 2));
        console.error('=== ERROR KEYS ===');
        console.error(Object.keys(error));

        if (error?.cause) {
            console.error('=== ERROR CAUSE ===');
            console.error(JSON.stringify(error.cause, null, 2));
        }

        if (error?.response) {
            console.error('=== ERROR RESPONSE ===');
            console.error(JSON.stringify(error.response, null, 2));
        }

        let errorMessage = error?.message || (typeof error === 'string' ? error : 'Error desconocido');

        // Si el error es un objeto de respuesta de MP (que a veces el SDK devuelve así)
        if (error?.status && error?.message) {
            errorMessage = `${error.message} (Status: ${error.status})`;
        }

        if (error?.response) {
            errorMessage += ` (API: ${JSON.stringify(error.response.data || error.response)})`;
        }

        throw new Error('Error al iniciar el proceso de suscripción: ' + errorMessage);
    }
}
