
const ACCESS_TOKEN = 'APP_USR-4280384698836137-020816-a01300b76719f258c1dbc910c79a574e-3189205256';
const PLAN_ID = '9ca6b291fdea4956ac9712162f26f160';

async function testNoEmail() {
    console.log(`\n--- Testing: No Email ---`);
    const response = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            preapproval_plan_id: PLAN_ID,
            external_reference: 'test-no-email'
        }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
}

testNoEmail();
