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

## 4. Implementación del Checkout
Al crear la preferencia en tu Frontend (Next.js), asegúrate de enviar el `external_reference`:

```typescript
// Ejemplo en una Server Action
const preference = await new Preference(client).create({
  body: {
    items: [ ... ],
    external_reference: userId, // Tu Clerk ID
    metadata: {
      plan_tier: 'pro'
    },
    notification_url: "https://<tu-proyecto>.supabase.co/functions/v1/mercadopago-webhook"
  }
});
```

## 5. Control de Acceso
Como Mercado Pago es manual, usamos la tabla `subscriptions` de Supabase:

```typescript
const { data: sub } = await supabase
  .from('subscriptions')
  .select('tier')
  .eq('user_id', userId)
  .single();

if (sub?.tier === 'pro' || sub?.tier === 'elite') {
  // Acceso permitido
}
```
