'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { auth } from '@clerk/nextjs/server';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function createCheckoutPreference(plan: {
    id: string;
    name: string;
    price: number;
    tier: string;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('No estás autenticado');
    }

    const preference = new Preference(client);

    try {
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: plan.id,
                        title: `Oportunia - Plan ${plan.name}`,
                        quantity: 1,
                        unit_price: plan.price,
                        currency_id: 'ARS',
                    },
                ],
                external_reference: userId,
                metadata: {
                    plan_tier: plan.tier,
                    user_id: userId,
                },
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pricing?payment=failure`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pricing?payment=pending`,
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mercadopago-webhook`,
            },
        });

        return { url: result.init_point };
    } catch (error) {
        console.error('Error creando preferencia MP:', error);
        throw new Error('Error al iniciar el pago');
    }
}
