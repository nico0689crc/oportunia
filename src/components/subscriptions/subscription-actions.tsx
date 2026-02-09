'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    XCircle,
    Loader2,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import {
    cancelSubscription
} from '@/lib/actions/mercadopago';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SubscriptionActionsProps {
    subscriptionId: string;
    status: string;
    tier?: string;
    expirationDate?: string;
}

export function SubscriptionActions({ subscriptionId, status, tier, expirationDate }: SubscriptionActionsProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const handleCancel = async () => {
        setLoading(true);
        try {
            const result = await cancelSubscription(subscriptionId);
            toast.success('Suscripción cancelada correctamente');

            if (result?.success) {
                router.refresh();
            }
        } catch (error: unknown) {
            console.error('[SubscriptionAction] Error cancelling:', error);
            const message = error instanceof Error ? error.message : 'Error al cancelar la suscripción';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    if (status === 'cancelled') {
        return (
            <div className="space-y-3">
                <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-md">
                    <div className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-900 dark:text-amber-400 mb-1">
                                Suscripción Cancelada
                            </p>
                            <p className="text-amber-800 dark:text-amber-300">
                                Mantienes acceso hasta el <span className="font-semibold">{formatDate(expirationDate)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Renovar Ahora
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Advertencia: Doble Pago
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3 pt-2" asChild>
                                    <div>
                                        <p>
                                            Ya tienes acceso <span className="font-semibold text-foreground">{tier?.toUpperCase()}</span> hasta el <span className="font-semibold text-foreground">{formatDate(expirationDate)}</span>.
                                        </p>
                                        <p>
                                            Si renuevas ahora, pagarás el ciclo completo nuevamente y tu próximo cobro será aproximadamente un mes después de hoy.
                                        </p>
                                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-md">
                                            <p className="text-amber-900 dark:text-amber-400 font-semibold text-sm">
                                                💡 Recomendación
                                            </p>
                                            <p className="text-amber-800 dark:text-amber-300 text-sm mt-1">
                                                Espera hasta que expire tu periodo actual para evitar el doble pago.
                                            </p>
                                        </div>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Link href="/dashboard/billing">
                                        Renovar de Todas Formas
                                    </Link>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Cancelar Suscripción
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cancelará tu suscripción permanentemente. No se realizarán más cobros automáticos, pero mantendrás acceso a las funciones Pro hasta el final del periodo actual.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Confirmar Cancelación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
