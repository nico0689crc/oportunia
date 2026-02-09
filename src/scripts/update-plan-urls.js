// Script to update Mercado Pago plan back_urls
// Usage: node src/scripts/update-plan-urls.js

const ACCESS_TOKEN = 'APP_USR-4280384698836137-020816-a01300b76719f258c1dbc910c79a574e-3189205256';
const APP_URL = 'https://oportunia.vercel.app'; // ⬅️ URL correcta de producción

// IDs de tus planes actuales
const PLAN_PRO_ID = '9ca6b291fdea4956ac9712162f26f160';
const PLAN_ELITE_ID = '6fe66c35cddc46f6b7d37caab8c32bad';

async function updatePlanUrl(planId, planName) {
    console.log(`Updating ${planName} (${planId})...`);

    const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            back_url: `${APP_URL}/dashboard/billing/success`
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error(`❌ Error updating ${planName}:`, data);
        return false;
    }

    console.log(`✅ Success! ${planName} now redirects to: ${APP_URL}/dashboard/billing/success`);
    return true;
}

async function run() {
    console.log('🔧 Updating Mercado Pago plan URLs...\n');

    await updatePlanUrl(PLAN_PRO_ID, 'Plan PRO');
    await updatePlanUrl(PLAN_ELITE_ID, 'Plan ELITE');

    console.log('\n✅ Done! Test by subscribing to a plan and checking the redirect button.');
}

run();
