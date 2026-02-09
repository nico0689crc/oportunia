import { auth } from '@clerk/nextjs/server';
import { getSubscriptionData } from '@/lib/subscriptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Calendar } from 'lucide-react';
import { UsageMeter } from './usage-meter';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionActions } from './subscription-actions';

export async function SubscriptionStatus() {
    const { userId } = await auth();
    if (!userId) return null;

    const sub = await getSubscriptionData(userId);
    const isStatusActive = sub.status === 'active' || sub.subscription_status === 'authorized';
    const isCancelled = sub.status === 'cancelled' || sub.subscription_status === 'cancelled';
    const expirationDate = sub.next_billing_date ? new Date(sub.next_billing_date) : new Date(sub.usage_reset_at);
    const hasNotExpired = expirationDate > new Date();

    // El beneficio está activo si el status es activo O si está cancelado pero no expirado
    const isBenefitActive = isStatusActive || (isCancelled && hasNotExpired);
    const tier = isBenefitActive ? sub.tier : 'free';

    const tierColors: Record<string, string> = {
        free: 'bg-slate-500',
        pro: 'bg-blue-600',
        elite: 'bg-purple-600'
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Tu Suscripción
                </CardTitle>
                <CardDescription>
                    Gestiona tu nivel de acceso y facturación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Plan Actual</p>
                        <p className="text-sm text-muted-foreground capitalize">
                            {isBenefitActive ? sub.tier : 'Free'}
                        </p>
                    </div>
                    <Badge className={tierColors[tier]}>{tier.toUpperCase()}</Badge>
                </div>

                <div className="space-y-6">
                    <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                        <UsageMeter />
                    </Suspense>

                    {isBenefitActive && sub.next_billing_date && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>
                                {isCancelled ? 'Vence el:' : 'Próximo cobro:'} <span className="font-semibold text-foreground">{formatDate(sub.next_billing_date)}</span>
                            </span>
                        </div>
                    )}

                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        {tier === 'free' && !isCancelled ? (
                            "Estás en el plan gratuito. Mejora para desbloquear más búsquedas y análisis con IA."
                        ) : isCancelled && !hasNotExpired ? (
                            "Tu suscripción ha expirado. Has vuelto al plan gratuito."
                        ) : (
                            `Tu suscripción se encuentra activa.`
                        )}
                    </div>

                    {(isBenefitActive || isCancelled) && sub.preapproval_id ? (
                        <SubscriptionActions
                            subscriptionId={sub.preapproval_id}
                            status={sub.subscription_status || sub.status}
                            tier={sub.tier}
                            expirationDate={sub.next_billing_date || undefined}
                        />
                    ) : tier !== 'free' && (
                        <Button variant="outline" className="w-full flex items-center gap-2" asChild>
                            <a href="https://www.mercadopago.com.ar/subscriptions" target="_blank" rel="noreferrer">
                                Gestionar en Mercado Pago
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
