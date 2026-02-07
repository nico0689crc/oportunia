import { createClient } from '@supabase/supabase-js';
import { Target, Zap, Shield, LucideIcon } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar service role en server-side

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface Plan {
    id: string;
    tier: SubscriptionTier;
    name: string;
    description: string;
    price: number;
    features: string[];
    icon: LucideIcon;
    buttonText: string;
    highlight: boolean;
}

export const PLANS: Plan[] = [
    {
        id: 'plan_free',
        tier: 'free',
        name: 'Cazador',
        description: 'Para principiantes que buscan su primer nicho.',
        price: 0,
        features: [
            '5 Búsquedas de nichos / mes',
            '3 Análisis con IA / mes',
            '1 Campaña con IA / mes',
            '1 Producto monitoreado',
            'Soporte comunitario',
        ],
        icon: Target,
        buttonText: 'Plan Actual',
        highlight: false,
    },
    {
        id: 'plan_pro',
        tier: 'pro',
        name: 'Vendedor',
        description: 'Para vendedores activos que quieren escalar.',
        price: 15000,
        features: [
            '50 Búsquedas de nichos / mes',
            '30 Análisis con IA / mes',
            '15 Campañas con IA / mes',
            '20 Productos monitoreados',
            'Alertas en tiempo real',
            'Soporte prioritario',
        ],
        icon: Zap,
        buttonText: 'Elegir Plan Vendedor',
        highlight: true,
    },
    {
        id: 'plan_elite',
        tier: 'elite',
        name: 'Dominador',
        description: 'Para power sellers y agencias.',
        price: 45000,
        features: [
            'Búsquedas Ilimitadas',
            'Análisis con IA Ilimitados',
            'Campañas con IA Ilimitadas',
            'Monitoreo Ilimitado',
            'Alertas Avanzadas',
            'Soporte 24/7 Personalizado',
        ],
        icon: Shield,
        buttonText: 'Elegir Plan Dominador',
        highlight: false,
    },
];

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
