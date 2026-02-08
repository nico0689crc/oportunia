import { supabaseAdmin } from '@/lib/supabase/admin';
import { SubscriptionTier, PLAN_LIMITS } from '@/lib/plans';

// Re-export types for backward compatibility if needed, though direct import is preferred
export type { SubscriptionTier } from '@/lib/plans';
export { PLANS, PLAN_LIMITS } from '@/lib/plans';

export interface SubscriptionData {
    tier: SubscriptionTier;
    usage_count: number;
    usage_reset_at: string;
    status: string;
}

export async function getSubscriptionData(userId: string): Promise<SubscriptionData> {
    const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('tier, usage_count, usage_reset_at, status')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return {
            tier: 'free',
            usage_count: 0,
            usage_reset_at: new Date().toISOString(),
            status: 'inactive'
        };
    }

    return data as SubscriptionData;
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
    const data = await getSubscriptionData(userId);
    // Solo devolvemos el tier si está activo o si es el plan gratuito
    if (data.tier !== 'free' && data.status !== 'active') {
        return 'free';
    }
    return data.tier;
}

export async function checkAndIncrementUsage(userId: string, feature: keyof typeof PLAN_LIMITS['free']): Promise<{ allowed: boolean; remaining: number }> {
    const sub = await getSubscriptionData(userId);

    // Si no está activo y no es free, forzamos límites de free
    const effectiveTier = (sub.tier !== 'free' && sub.status !== 'active') ? 'free' : sub.tier;
    const limit = PLAN_LIMITS[effectiveTier as keyof typeof PLAN_LIMITS][feature];

    // Si el límite es Infinity, siempre permitido
    if (limit === Infinity) return { allowed: true, remaining: 999 };

    if (sub.usage_count >= (limit as number)) {
        return { allowed: false, remaining: 0 };
    }

    // Incrementar uso
    await supabaseAdmin
        .from('subscriptions')
        .update({ usage_count: sub.usage_count + 1 })
        .eq('user_id', userId);

    return { allowed: true, remaining: (limit as number) - (sub.usage_count + 1) };
}
