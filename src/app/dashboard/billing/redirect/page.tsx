import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createSubscriptionPreference } from '@/lib/actions/mercadopago';
import { PLANS } from '@/lib/subscriptions';

interface Props {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BillingRedirectPage({ searchParams }: Props) {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const planTier = searchParams.plan as string;
    const plan = PLANS.find(p => p.tier === planTier);

    if (!plan || plan.tier === 'free') {
        redirect('/dashboard');
    }

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
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Preparando tu suscripción...</h2>
                <p className="text-muted-foreground">Te estamos redirigiendo a Mercado Pago para completar el proceso.</p>
            </div>
        </div>
    );
}
