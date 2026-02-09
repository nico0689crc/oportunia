'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Pause,
    Play,
    XCircle,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import {
    pauseSubscription,
    reactivateSubscription,
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
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

interface SubscriptionActionsProps {
    subscriptionId: string;
    status: string;
}

export function SubscriptionActions({ subscriptionId, status }: SubscriptionActionsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const handleAction = async (action: 'pause' | 'reactivate' | 'cancel') => {
        setLoading(action);
        try {
            let result;
            if (action === 'pause') {
                result = await pauseSubscription(subscriptionId);
                toast.success('Suscripción pausada correctamente');
            } else if (action === 'reactivate') {
                result = await reactivateSubscription(subscriptionId);
                toast.success('Suscripción reactivada correctamente');
            } else if (action === 'cancel') {
                result = await cancelSubscription(subscriptionId);
                toast.success('Suscripción cancelada correctamente');
            }

            if (result?.success) {
                router.refresh();
            }
        } catch (error: unknown) {
            console.error(`[SubscriptionAction] Error ${action}:`, error);
            const message = error instanceof Error ? error.message : `Error al ${action} la suscripción`;
            toast.error(message);
        } finally {
            setLoading(null);
        }
    };

    if (status === 'cancelled') {
        return (
            <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-md flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Esta suscripción ha sido cancelada y no recibirá más cobros.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
                {status === 'paused' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => handleAction('reactivate')}
                        disabled={loading !== null}
                    >
                        {loading === 'reactivate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Reactivar
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => handleAction('pause')}
                        disabled={loading !== null}
                    >
                        {loading === 'pause' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                        Pausar
                    </Button>
                )}

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={loading !== null}
                        >
                            {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            Cancelar
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción cancelará tu suscripción permanentemente. No se realizarán más cobros automáticos, pero perderás acceso a las funciones Pro al finalizar el periodo actual.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Volver</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleAction('cancel')}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Confirmar Cancelación
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
