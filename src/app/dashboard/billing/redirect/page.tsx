import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSubscriptionPreference } from '@/lib/actions/mercadopago';
import { PLANS, getSubscriptionData } from '@/lib/subscriptions';
import { Loader2, ShieldCheck } from 'lucide-react';

interface Props {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BillingRedirectPage({ searchParams }: Props) {
    const { userId } = await auth();
    const user = await currentUser();

    // Next.js 15+: searchParams is now async
    const params = await searchParams;
    const planParam = params.plan;
    let planTier = Array.isArray(planParam) ? planParam[0] : planParam;

    // Fallback: buscamos en los metadatos si no vino en la URL
    if (!planTier && user?.unsafeMetadata?.intendedPlan) {
        planTier = user.unsafeMetadata.intendedPlan as string;
    }

    console.log('[BillingRedirect] Hit!', {
        userId,
        planTier,
        allParams: params
    });

    if (!userId) {
        console.warn('[BillingRedirect] No userId found, redirecting to sign-in');
        redirect('/sign-in');
    }

    const plan = PLANS.find(p => p.tier === planTier);

    if (!plan || plan.tier === 'free') {
        console.log('[BillingRedirect] No valid paid plan found, falling back to dashboard', { planTier });
        redirect('/dashboard');
    }

    // Si ya tiene el plan activo, no necesita pagar de nuevo
    if (userId) {
        const sub = await getSubscriptionData(userId);
        if (sub.status === 'active' && sub.tier === plan.tier) {
            console.log('[BillingRedirect] User already has an active subscription for this tier, skipping checkout');
            redirect('/dashboard');
        }
    }

    console.log('[BillingRedirect] Creating subscription preference for plan:', plan.name);

    try {
        const { url } = await createSubscriptionPreference(plan);
        if (url) {
            redirect(url);
        }
    } catch (error) {
        console.error('Error in automated billing redirect:', error);
        redirect('/dashboard/pricing?error=checkout_failed');
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-muted/50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                    <div className="relative flex items-center justify-center w-20 h-20 bg-primary/5 rounded-full border-2 border-primary/20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 text-slate-900 tracking-tight">Preparando tu suscripción</h2>
                <p className="text-slate-500 mb-6">
                    Te estamos redirigiendo a la pasarela de pago segura de <strong>Mercado Pago</strong> para el plan <span className="text-primary font-semibold">{plan.name}</span>.
                </p>

                <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" /> Pago 100% Seguro
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 italic">No cierres esta ventana, serás redirigido en segundos...</p>
                </div>
            </div>
        </div>
    );
}
