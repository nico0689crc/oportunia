// Create DEVELOPMENT subscription plans for ngrok testing
// Usage: node src/scripts/setup-dev-plans.js

const ACCESS_TOKEN = 'APP_USR-4280384698836137-020816-a01300b76719f258c1dbc910c79a574e-3189205256';
const APP_URL = 'https://generously-nonadmissible-enedina.ngrok-free.dev';

async function createPlan(name, price) {
    console.log(`Creating DEV plan: ${name} at $${price}...`);

    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reason: `Oportunia DEV - Plan ${name}`,
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
        console.error(`❌ Error creating ${name}:`, data);
        return null;
    }

    console.log(`✅ Success! Plan ${name} DEV ID: ${data.id}`);
    return data.id;
}

async function run() {
    console.log('🛠️  Creating DEVELOPMENT subscription plans...\n');
    console.log(`Back URL: ${APP_URL}/dashboard/billing/success\n`);

    const proDevId = await createPlan('Vendedor', 15000);
    const eliteDevId = await createPlan('Dominador', 45000);

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEVELOPMENT PLANS CREATED');
    console.log('='.repeat(80));
    console.log('\nAdd these to your database (via admin panel or migration):');
    console.log(`mp_plan_pro_dev_id: ${proDevId}`);
    console.log(`mp_plan_elite_dev_id: ${eliteDevId}`);
    console.log('\nOr add to .env.local:');
    console.log(`MP_PLAN_PRO_DEV_ID=${proDevId}`);
    console.log(`MP_PLAN_ELITE_DEV_ID=${eliteDevId}`);
}

run();
