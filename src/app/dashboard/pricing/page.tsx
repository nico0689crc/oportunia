'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { createSubscriptionPreference } from '@/lib/actions/mercadopago';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS, type Plan } from '@/lib/subscriptions';

export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (plan: Plan) => {
        if (plan.tier === 'free') return;

        setLoading(plan.id);
        try {
            const { url } = await createSubscriptionPreference(plan);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error(error);
            alert('Hubo un error al iniciar el proceso de suscripción.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                    Planes que impulsan tus ventas
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Elige el plan ideal para tu nivel de ventas en Mercado Libre y deja que la IA trabaje por ti.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {PLANS.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`flex flex-col relative overflow-hidden transition-all hover:shadow-xl ${plan.highlight ? 'border-primary shadow-lg scale-105 z-10' : ''
                            }`}
                    >
                        {plan.highlight && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                RECOMENDADO
                            </div>
                        )}
                        <CardHeader>
                            <div className="mb-4">
                                <plan.icon className={`h-12 w-12 ${plan.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription className="min-h-[3rem]">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="mb-6">
                                <span className="text-4xl font-bold">${plan.price.toLocaleString('es-AR')}</span>
                                {plan.price > 0 && <span className="text-muted-foreground ml-1">/mes</span>}
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start text-sm">
                                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.highlight ? 'default' : 'outline'}
                                disabled={plan.tier === 'free' || !!loading}
                                onClick={() => handleSubscribe(plan)}
                            >
                                {loading === plan.id ? 'Cargando...' : plan.buttonText}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="mt-16 text-center text-sm text-muted-foreground">
                <p>Todos los precios están expresados en Pesos Argentinos (ARS).</p>
                <p>¿Tienes dudas? Contáctanos para un plan a medida.</p>
            </div>
        </div>
    );
}
