import { auth } from '@clerk/nextjs/server';
import { getUserTier } from '@/lib/subscriptions';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function SubscriptionStatus() {
    const { userId } = await auth();
    if (!userId) return null;

    const tier = await getUserTier(userId);

    // Buscar info extendida en la DB
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

    const tierColors: Record<string, string> = {
        free: 'bg-slate-500',
        pro: 'bg-blue-600',
        elite: 'bg-purple-600'
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
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Plan Actual</p>
                        <p className="text-sm text-muted-foreground capitalize">{tier}</p>
                    </div>
                    <Badge className={tierColors[tier]}>{tier.toUpperCase()}</Badge>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        {tier === 'free' ? (
                            "Estás en el plan gratuito. Mejora para desbloquear más búsquedas y análisis con IA."
                        ) : (
                            `Tu suscripción se encuentra ${sub?.status === 'active' ? 'activa' : 'pendiente'}.`
                        )}
                    </div>

                    {tier !== 'free' && (
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
