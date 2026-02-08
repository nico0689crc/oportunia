'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, ShieldCheck } from 'lucide-react';
import { createSubscriptionAction } from '@/lib/actions/mercadopago';
import { getMPPublicKeyAction } from '@/actions/admin';
import { toast } from 'sonner';
import Script from 'next/script';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        name: string;
        price: number;
        tier: string;
    };
}

declare global {
    interface Window {
        MercadoPago: new (publicKey: string, options: { locale: string }) => {
            bricks: () => {
                create: (type: string, id: string, settings: unknown) => Promise<unknown>;
            };
        };
    }
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const brickBuilderRef = useRef<unknown>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchKey = async () => {
            const result = await getMPPublicKeyAction();
            if (result.success && result.publicKey) {
                setPublicKey(result.publicKey);
            } else {
                toast.error('No se pudo cargar la configuración de pagos. Por favor intenta más tarde.');
                onClose();
            }
        };

        if (isOpen && !publicKey) {
            fetchKey();
        }
    }, [isOpen, publicKey, onClose]);

    useEffect(() => {
        if (!isOpen || !sdkLoaded || !publicKey || !containerRef.current) return;

        const mp = new window.MercadoPago(publicKey, {
            locale: 'es-AR'
        });

        const bricksBuilder = mp.bricks();

        const renderCardBrick = async (builder: { create: (type: string, id: string, settings: unknown) => Promise<unknown> }) => {
            const settings = {
                initialization: {
                    amount: plan.price,
                    payer: {
                        email: '', // El SDK pedirá el email si no se provee
                    },
                },
                customization: {
                    visual: {
                        style: {
                            theme: 'default', // o 'dark'
                        },
                    },
                    paymentMethods: {
                        maxInstallments: 1, // Para suscripciones suele ser 1 pago
                    }
                },
                callbacks: {
                    onReady: () => {
                        console.log('Card Brick ready');
                    },
                    onSubmit: async (formData: { token: string }) => {
                        try {
                            setLoading(true);
                            console.log('Form data received from Brick:', formData);

                            // Llamar a nuestra acción de servidor con el token generado
                            const result = await createSubscriptionAction(plan, formData.token);

                            if (result.success) {
                                toast.success('¡Suscripción procesada con éxito!');
                                window.location.href = '/dashboard?subscription=success';
                            } else {
                                throw new Error('Error al procesar el pago');
                            }
                        } catch (error: unknown) {
                            console.error('Error submitting payment:', error);
                            const message = error instanceof Error ? error.message : 'Error al procesar el pago. Por favor verifica los datos de tu tarjeta.';
                            toast.error(message);
                        } finally {
                            setLoading(false);
                        }
                    },
                    onError: (error: unknown) => {
                        console.error('Brick Error:', error);
                        toast.error('Error al cargar el formulario de pago.');
                    },
                },
            };

            brickBuilderRef.current = await builder.create('cardPayment', 'cardPaymentBrick_container', settings);
        };

        renderCardBrick(bricksBuilder);

        return () => {
            // Limpiar el brick al cerrar
            if (brickBuilderRef.current) {
                // mp.bricks().unmount('cardPaymentBrick_container'); // A veces falla en React si el container ya se fue
            }
        };
    }, [isOpen, sdkLoaded, publicKey, plan]);

    return (
        <>
            <Script
                src="https://sdk.mercadopago.com/js/v2"
                onLoad={() => setSdkLoaded(true)}
            />

            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-primary text-primary-foreground">
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6" /> Finalizar Suscripción
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80">
                            Estás adquiriendo el plan <strong>{plan.name}</strong> por <strong>AR$ {plan.price}/mes</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 bg-white">
                        {!sdkLoaded || !publicKey ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Iniciando pasarela de pago segura...</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <div id="cardPaymentBrick_container" ref={containerRef}></div>
                                {loading && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-50">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                                        <p className="text-sm font-bold text-primary">Procesando pago seguro...</p>
                                        <p className="text-xs text-muted-foreground mt-1 text-center px-4">Por favor no cierres esta ventana.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                            <ShieldCheck className="h-3 w-3" /> Pagos procesados de forma segura por Mercado Pago
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
