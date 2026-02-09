
const ACCESS_TOKEN = 'APP_USR-4280384698836137-020816-a01300b76719f258c1dbc910c79a574e-3189205256';
const APP_URL = 'https://generously-nonadmissible-enedina.ngrok-free.dev';

async function createPlan(name, price) {
    console.log(`Creating plan: ${name} at ${price} using Test Seller Token...`);
    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reason: `Suscripción Oportunia - Plan ${name}`,
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: price,
                currency_id: 'ARS',
            },
            back_url: `${APP_URL}/dashboard/billing/success`,
            status: 'active',
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        console.error(`Error creating ${name}:`, data);
        return null;
    }
    console.log(`Success! Plan ${name} ID: ${data.id}`);
    return data.id;
}

async function run() {
    const proId = await createPlan('Vendedor', 15000);
    const eliteId = await createPlan('Dominador', 45000);

    console.log('\n--- UPDATE YOUR .env.local AND DB ---');
    console.log(`MP_PLAN_PRO_ID=${proId}`);
    console.log(`MP_PLAN_ELITE_ID=${eliteId}`);
    console.log(`Use this token in mp_test_config: ${ACCESS_TOKEN}`);
}

run();
