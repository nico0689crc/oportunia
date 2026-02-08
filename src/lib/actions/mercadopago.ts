'use server';

import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { auth } from '@clerk/nextjs/server';
import { getValidAdminToken } from '@/lib/mercadopago/admin-auth';

export async function createSubscriptionPreference(plan: {
    name: string;
    price: number;
    tier: string;
}) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        throw new Error('No estás autenticado');
    }

    const payerEmail = (sessionClaims?.email as string) || 'test_user_123@test.com';

    const accessToken = await getValidAdminToken();
    const mongoClient = new MercadoPagoConfig({
        accessToken: accessToken,
    });

    const preapproval = new PreApproval(mongoClient);

    try {
        console.log('Creating MP PreApproval for:', { planName: plan.name, userId, payerEmail });

        const result = await preapproval.create({
            body: {
                reason: `Oportunia - Plan ${plan.name}`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.price,
                    currency_id: 'ARS',
                },
                back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
                external_reference: `${userId}|${plan.tier}`,
                payer_email: payerEmail,
                status: 'pending',
            },
        });

        console.log('MP PreApproval created successfully:', result.id);
        return { url: result.init_point };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error creando suscripción MP:', message);
        if (error && typeof error === 'object' && 'response' in error) {
            console.error('MP API Error Details:', error.response);
        }
        throw new Error('Error al iniciar el proceso de suscripción: ' + message);
    }
}
