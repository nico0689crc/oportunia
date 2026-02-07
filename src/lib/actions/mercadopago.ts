'use server';

import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { auth } from '@clerk/nextjs/server';
import { getValidAdminToken } from '@/lib/mercadopago/admin-auth';

export async function createSubscriptionPreference(plan: {
    name: string;
    price: number;
    tier: string;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('No estás autenticado');
    }

    const accessToken = await getValidAdminToken();
    const mongoClient = new MercadoPagoConfig({
        accessToken: accessToken,
    });

    const preapproval = new PreApproval(mongoClient);

    try {
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
                external_reference: userId,
                payer_email: 'test_user_123@test.com', // En prod sacar de Clerk
                card_token_id: '', // Se llena en el checkout de MP
                status: 'pending',
            },
        });

        return { url: result.init_point };
    } catch (error) {
        console.error('Error creando suscripción MP:', error);
        throw new Error('Error al iniciar el proceso de suscripción');
    }
}
