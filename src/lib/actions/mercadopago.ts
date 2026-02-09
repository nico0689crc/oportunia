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

/**
 * Creates a recurring subscription using Mercado Pago Preapproval API
 * This enables automatic monthly billing
 */
export async function createRecurringSubscription(plan: {
    name: string;
    price: number;
    tier: string;
}) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        console.error('[MP Preapproval Error] No userId found in session');
        throw new Error('No estás autenticado');
    }

    console.log('--- MP DEBUG: Entering createRecurringSubscription ---');
    console.log('[MP Preapproval] Plan:', plan.tier);

    // Get plan ID from environment
    const planId = plan.tier === 'pro'
        ? process.env.MP_PLAN_PRO_ID
        : process.env.MP_PLAN_ELITE_ID;

    if (!planId) {
        console.error('[MP Preapproval Error] Plan ID not configured for tier:', plan.tier);
        throw new Error(`Plan de suscripción no configurado para: ${plan.tier}`);
    }

    console.log('[MP Preapproval] Using plan ID:', planId);

    // Get access token
    let accessToken: string;
    try {
        accessToken = await getValidMPToken();
        console.log('[MP Preapproval] Got access token');
    } catch (tokenError: unknown) {
        console.error('[MP Preapproval Critical] Failed to get Access Token:', tokenError);
        const errorMessage = tokenError instanceof Error ? tokenError.message : 'Error desconocido';
        throw new Error('Error de configuración de pago (Token): ' + errorMessage);
    }

    // Check if we're in test mode
    const { getAppSettingsAction } = await import('@/actions/admin');
    const mpMode = await getAppSettingsAction<string>('mp_mode');
    const isTestMode = mpMode === 'test';
    const siteId = process.env.ML_SITE_ID || 'MLA';

    // In test mode, use a unique test email
    const testPayerEmail = `test_buyer_${userId.substring(userId.length - 5)}_${siteId.toLowerCase()}@testuser.com`;
    const finalPayerEmail = isTestMode ? testPayerEmail : (sessionClaims?.email as string);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    try {
        // Create preapproval subscription using direct API call
        // Note: The SDK doesn't have full Preapproval support yet, so we use fetch
        const preapprovalBody = {
            preapproval_plan_id: planId,
            reason: `Suscripción Oportunia - Plan ${plan.name}`,
            external_reference: `${userId}|${plan.tier}|subscription`,
            payer_email: finalPayerEmail,
            back_url: `${appUrl}/dashboard/billing/success`,
            status: 'pending', // User must authorize the subscription
        };

        console.log('[MP Preapproval] Creating subscription with body:', JSON.stringify(preapprovalBody, null, 2));

        const response = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preapprovalBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[MP Preapproval] API Error:', errorData);
            throw new Error(`MP API Error: ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        console.log('[MP Preapproval] Subscription created successfully:', result.id);

        // Save pending subscription to database
        console.log('[MP Preapproval] Upserting pending subscription record for:', userId);
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
            console.error('[MP Preapproval] Error upserting subscription:', upsertError);
        } else {
            console.log('[MP Preapproval] Subscription upserted successfully');
        }

        return { url: result.init_point };
    } catch (error: unknown) {
        console.error('=== FULL MP PREAPPROVAL ERROR ===');
        console.error(error);

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error('Error al crear suscripción recurrente: ' + errorMessage);
    }
}

/**
 * Updates a subscription status in Mercado Pago
 */
async function updateSubscriptionStatus(subscriptionId: string, status: 'authorized' | 'paused' | 'cancelled') {
    const accessToken = await getValidMPToken();

    const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error(`[MP Subscription] Error updating status to ${status}:`, errorData);
        throw new Error(`Error de Mercado Pago: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
}

/**
 * Cancels a recurring subscription
 */
export async function cancelSubscription(subscriptionId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('No estás autenticado');

    console.log(`[MP Subscription] Cancelling subscription: ${subscriptionId} for user: ${userId}`);

    try {
        const result = await updateSubscriptionStatus(subscriptionId, 'cancelled');

        // Update database
        const { error } = await supabaseAdmin
            .from('subscriptions')
            .update({
                status: 'cancelled',
                subscription_status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('preapproval_id', subscriptionId);

        if (error) {
            console.error('[MP Subscription] Error updating database after cancellation:', error);
        }

        return { success: true, status: result.status };
    } catch (error: unknown) {
        console.error('[MP Subscription] Cancellation failed:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error('No se pudo cancelar la suscripción: ' + message);
    }
}

/**
 * Pauses a recurring subscription
 */
export async function pauseSubscription(subscriptionId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('No estás autenticado');

    console.log(`[MP Subscription] Pausing subscription: ${subscriptionId} for user: ${userId}`);

    try {
        const result = await updateSubscriptionStatus(subscriptionId, 'paused');

        // Update database
        const { error } = await supabaseAdmin
            .from('subscriptions')
            .update({
                status: 'paused',
                subscription_status: 'paused',
                updated_at: new Date().toISOString()
            })
            .eq('preapproval_id', subscriptionId);

        if (error) {
            console.error('[MP Subscription] Error updating database after pausing:', error);
        }

        return { success: true, status: result.status };
    } catch (error: unknown) {
        console.error('[MP Subscription] Pause failed:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error('No se pudo pausar la suscripción: ' + message);
    }
}

/**
 * Reactivates a paused subscription
 */
export async function reactivateSubscription(subscriptionId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('No estás autenticado');

    console.log(`[MP Subscription] Reactivating subscription: ${subscriptionId} for user: ${userId}`);

    try {
        const result = await updateSubscriptionStatus(subscriptionId, 'authorized');

        // Update database
        const { error } = await supabaseAdmin
            .from('subscriptions')
            .update({
                status: 'active',
                subscription_status: 'authorized',
                updated_at: new Date().toISOString()
            })
            .eq('preapproval_id', subscriptionId);

        if (error) {
            console.error('[MP Subscription] Error updating database after reactivation:', error);
        }

        return { success: true, status: result.status };
    } catch (error: unknown) {
        console.error('[MP Subscription] Reactivation failed:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error('No se pudo reactivar la suscripción: ' + message);
    }
}
