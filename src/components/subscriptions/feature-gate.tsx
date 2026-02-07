import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { getUserTier, PLAN_LIMITS, SubscriptionTier } from '@/lib/subscriptions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface FeatureGateProps {
    feature: keyof typeof PLAN_LIMITS.free;
    children: ReactNode;
    fallback?: ReactNode;
}

export async function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
    const { userId } = await auth();

    if (!userId) return null;

    const tier = await getUserTier(userId);
    const hasAccess = PLAN_LIMITS[tier][feature];

    // Si es booleano y es falso, o si es un número y es 0 (usando 1 como mínimo para simplificar)
    if (typeof hasAccess === 'boolean' && !hasAccess) {
        return fallback || <DefaultFallback />;
    }

    return <>{children}</>;
}

function DefaultFallback() {
    return (
        <div className="border-2 border-dashed border-yellow-500/50 bg-yellow-500/5 p-6 rounded-lg text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold mb-1">Función Premium</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Esta herramienta solo está disponible en los planes Vendedor y Dominador.
            </p>
            <Button asChild variant="default">
                <Link href="/dashboard/pricing">Ver Planes</Link>
            </Button>
        </div>
    );
}
