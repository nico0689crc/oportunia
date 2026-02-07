# 💳 Configuración de Mercado Pago para Oportunia

Esta guía detalla cómo integrar Mercado Pago para cobrar suscripciones en Argentina y LATAM.

## 1. Obtener Credenciales
1. Ve al [Dashboard de Desarrolladores](https://www.mercadopago.com.ar/developers/panel/app) de Mercado Pago.
2. Crea una aplicación llamada **Oportunia**.
3. En **Credenciales de Producción**, copia tu **Access Token**.

## 2. Configurar Secretos en Supabase
Ejecuta esto en tu terminal para que la Edge Function tenga acceso:
```bash
supabase secrets set MP_ACCESS_TOKEN=tu_access_token
```

## 3. Configurar el Webhook en Mercado Pago
1. En tu aplicación de MP, ve a **Webhooks**.
2. Configura la URL: `https://<tu-proyecto>.supabase.co/functions/v1/mercadopago-webhook`
3. Selecciona el evento: **Pagos** (`payments`).

## 4. Implementación de Suscripciones (Pre-approvals)
Al crear la suscripción en tu Frontend, usamos `PreApproval` para cobros automáticos:

```typescript
// En lib/actions/mercadopago.ts
const result = await preapproval.create({
  body: {
    reason: "Oportunia - Plan Pro",
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 15000,
      currency_id: 'ARS',
    },
    // ...
  }
});
```

## 5. Gestión de Suscripciones
Para que los usuarios cancelen o vean su estado, el Boilerplate incluye el componente `SubscriptionStatus` que enlaza al portal de suscripciones de Mercado Pago.
URL de gestión: `https://www.mercadopago.com.ar/subscriptions`
