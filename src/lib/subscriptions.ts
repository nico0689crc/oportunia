import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar service role en server-side

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface SubscriptionData {
    tier: SubscriptionTier;
    usage_count: number;
    usage_reset_at: string;
    status: string;
}

export async function getSubscriptionData(userId: string): Promise<SubscriptionData> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
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
    return data.tier;
}

export async function checkAndIncrementUsage(userId: string, feature: keyof typeof PLAN_LIMITS['free']): Promise<{ allowed: boolean; remaining: number }> {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const sub = await getSubscriptionData(userId);

    const limit = PLAN_LIMITS[sub.tier as keyof typeof PLAN_LIMITS][feature];

    // Si el límite es Infinity, siempre permitido
    if (limit === Infinity) return { allowed: true, remaining: 999 };

    if (sub.usage_count >= (limit as number)) {
        return { allowed: false, remaining: 0 };
    }

    // Incrementar uso
    await supabase
        .from('subscriptions')
        .update({ usage_count: sub.usage_count + 1 })
        .eq('user_id', userId);

    return { allowed: true, remaining: (limit as number) - (sub.usage_count + 1) };
}

export const PLAN_LIMITS = {
    free: {
        niche_search: 5,
        ai_analysis: 3,
        ai_campaigns: 1,
        product_monitor: 1,
    },
    pro: {
        niche_search: 50,
        ai_analysis: 30,
        ai_campaigns: 15,
        product_monitor: 20,
    },
    elite: {
        niche_search: Infinity,
        ai_analysis: Infinity,
        ai_campaigns: Infinity,
        product_monitor: Infinity,
    },
};
