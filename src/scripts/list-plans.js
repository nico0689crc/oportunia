// List all Mercado Pago subscription plans
// Usage: node src/scripts/list-plans.js

const ACCESS_TOKEN = 'APP_USR-4280384698836137-020816-a01300b76719f258c1dbc910c79a574e-3189205256';

async function listPlans() {
    console.log('🔍 Fetching all subscription plans from Mercado Pago...\n');

    const response = await fetch('https://api.mercadopago.com/preapproval_plan/search', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        console.error('❌ Error:', await response.text());
        return;
    }

    const data = await response.json();

    console.log(`✅ Found ${data.results.length} plan(s)\n`);
    console.log('='.repeat(80));

    data.results.forEach((plan, index) => {
        console.log(`\n📋 Plan ${index + 1}: ${plan.reason}`);
        console.log(`   ID: ${plan.id}`);
        console.log(`   Price: $${plan.auto_recurring.transaction_amount} ${plan.auto_recurring.currency_id}`);
        console.log(`   Frequency: Every ${plan.auto_recurring.frequency} ${plan.auto_recurring.frequency_type}`);
        console.log(`   Status: ${plan.status}`);
        console.log(`   Back URL: ${plan.back_url || 'Not set'}`);
        console.log(`   Created: ${plan.date_created}`);
    });

    console.log('\n' + '='.repeat(80));
}

listPlans().catch(console.error);
