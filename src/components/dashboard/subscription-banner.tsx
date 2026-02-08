'use client';

import { useState } from 'react';
import { AlertCircle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/subscriptions';
import Link from 'next/link';

interface Props {
    subscription: {
        tier: string;
        status: string;
    };
}

export function SubscriptionBanner({ subscription }: Props) {
    const [isVisible, setIsVisible] = useState(true);

    // No mostramos nada si ya está activo o si es el plan free real
    if (!isVisible || subscription.status === 'active' || subscription.tier === 'free') {
        return null;
    }

    const plan = PLANS.find(p => p.tier === subscription.tier);

    return (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 sm:px-6 animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full hidden sm:block">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-900 leading-none mb-1">
                            Suscripción {plan?.name} Pendiente
                        </p>
                        <p className="text-xs text-amber-700">
                            Tu pago aún no se ha confirmado. Completa el proceso para activar tus beneficios.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <Link href={`/dashboard/billing/redirect?plan=${subscription.tier}`}>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 transition-colors text-white border-none h-8 px-4 rounded-full">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Completar Pago
                        </Button>
                    </Link>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-amber-100 rounded-full text-amber-500 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
