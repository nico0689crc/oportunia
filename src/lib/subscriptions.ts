import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar service role en server-side

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return 'free';
    }

    return data.tier as SubscriptionTier;
}

export const PLAN_LIMITS = {
    free: {
        niche_search: 5,
        ai_analysis: 3,
        ai_campaigns: 1,
        product_monitor: 1,
        realtime_alerts: false,
    },
    pro: {
        niche_search: 50,
        ai_analysis: 30,
        ai_campaigns: 15,
        product_monitor: 20,
        realtime_alerts: true,
    },
    elite: {
        niche_search: Infinity,
        ai_analysis: Infinity,
        ai_campaigns: Infinity,
        product_monitor: Infinity,
        realtime_alerts: true,
    },
};
