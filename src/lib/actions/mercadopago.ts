'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
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


    const payerEmail = (sessionClaims?.email as string) || 'test_user_123@test.com';

    try {
        console.log('[MP Preference] Delegating to Supabase Edge Function for:', plan.name);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/create-mp-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan,
                userId,
                payerEmail,
                appUrl,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[MP Edge Error]:', result);
            throw new Error(result.error || 'Error en la Edge Function de Supabase');
        }

        console.log('[MP Preference] Edge Function success:', result.id);

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
        }

        return { url: result.url };
    } catch (error: unknown) {
        console.error('Error creating MP subscription:', error);

        let errorMessage = 'Error al iniciar el proceso de suscripción';

        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = String((error as { message: unknown }).message);
        }

        throw new Error(errorMessage);
    }
}
