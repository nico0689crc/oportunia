import { auth } from '@clerk/nextjs/server';
import { getSubscriptionData, PLAN_LIMITS } from '@/lib/subscriptions';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

export async function UsageMeter() {
    const { userId } = await auth();
    if (!userId) return null;

    const sub = await getSubscriptionData(userId);
    const isActive = sub.status === 'active' || sub.subscription_status === 'authorized';
    const isCancelled = sub.status === 'cancelled' || sub.subscription_status === 'cancelled';
    const hasNotExpired = sub.next_billing_date && new Date(sub.next_billing_date) > new Date();

    const effectiveTier = (isActive || (isCancelled && hasNotExpired)) ? sub.tier : 'free';
    const limit = PLAN_LIMITS[effectiveTier]['niche_search'];

    // Si es ilimitado, no mostramos el medidor de progreso ordinario
    if (limit === Infinity) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Uso de Búsquedas
                    </span>
                    <span className="font-medium text-primary">Ilimitado</span>
                </div>
            </div>
        );
    }

    const percentage = Math.min((sub.usage_count / (limit as number)) * 100, 100);
    const isCritical = percentage >= 80;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Búsquedas ({sub.usage_count} / {limit})
                </span>
                <span className={`font-medium ${isCritical ? 'text-destructive' : 'text-primary'}`}>
                    {Math.round(percentage)}%
                </span>
            </div>
            <Progress value={percentage} className="h-1.5" />
            {isCritical && percentage < 100 && (
                <p className="text-[10px] text-destructive font-medium animate-pulse">
                    ¡Casi llegas al límite! Considera subir de nivel.
                </p>
            )}
        </div>
    );
}
