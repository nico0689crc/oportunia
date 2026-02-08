# Guía Completa: Implementación de Suscripciones con Mercado Pago

## Resumen Ejecutivo

Esta guía documenta el proceso completo de implementación de suscripciones con Mercado Pago, incluyendo los desafíos encontrados y las soluciones aplicadas. Es una referencia para futuros proyectos SaaS.

---

## 🎯 Objetivo Final

Implementar un sistema de suscripciones mensuales que permita a los usuarios:
1. Seleccionar un plan de suscripción
2. Ser redirigidos a Mercado Pago para completar el pago
3. Regresar a la aplicación con la suscripción activada
4. Recibir notificaciones de renovación

---

## 🚨 Problemas Encontrados y Soluciones

### 1. Error: "Both payer and collector must be real or test users"

**Causa:** Mezcla de credenciales de producción con datos de usuario real en modo test.

**Solución:**
- Detectar correctamente el modo test usando `mp_mode` setting (no el prefijo del token)
- Usar emails de prueba genéricos en modo test: `test_buyer_{userId}_{siteId}@testuser.com`
- No enviar nombres/apellidos del usuario en modo test

```typescript
const isTestMode = mpMode === 'test';
const testPayerEmail = `test_buyer_${userId.substring(userId.length - 5)}_${siteId.toLowerCase()}@testuser.com`;
const finalPayerEmail = isTestMode ? testPayerEmail : (sessionClaims?.email as string);
```

### 2. Error: "Cannot operate between different countries"

**Causa:** Mismatch entre el país de la cuenta de prueba y el `siteId` usado.

**Solución:**
- Asegurar que `ML_SITE_ID` coincida con el país de la cuenta de prueba
- Para Argentina: `MLA` con moneda `ARS`
- Para Brasil: `MLB` con moneda `BRL`

### 3. Error: "Internal Server Error (500)" con PreApproval

**Causa:** La API de PreApproval tiene limitaciones en modo test para Argentina (MLA).

**Solución:** **Migrar a Checkout Pro (Preference API)**

---

## ✅ Solución Final: Checkout Pro

### Por qué Checkout Pro en lugar de PreApproval

| Aspecto | PreApproval | Checkout Pro |
|---------|-------------|--------------|
| **Estabilidad en Test** | ❌ Error 500 sin detalles | ✅ Funciona perfectamente |
| **Documentación** | ⚠️ Limitada | ✅ Extensa y clara |
| **Cobro Automático** | ✅ Sí | ❌ No (requiere renovación manual) |
| **Configuración** | ⚠️ Requiere plan en dashboard | ✅ No requiere configuración adicional |
| **Debugging** | ❌ Difícil | ✅ Errores claros |

### Implementación de Checkout Pro

#### 1. Crear Preferencia de Pago

```typescript
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken });
const preference = new Preference(client);

const preferenceBody = {
    items: [{
        title: `Suscripción - Plan ${plan.name}`,
        description: `Suscripción mensual al plan ${plan.name}`,
        quantity: 1,
        unit_price: plan.price,
        currency_id: siteId === 'MLB' ? 'BRL' : 'ARS',
    }],
    payer: {
        email: finalPayerEmail,
    },
    back_urls: {
        success: `${appUrl}/dashboard?subscription=success`,
        failure: `${appUrl}/dashboard/pricing?error=checkout_failed`,
        pending: `${appUrl}/dashboard?subscription=pending`,
    },
    auto_return: 'approved',
    external_reference: `${userId}|${planTier}|subscription`,
    metadata: {
        subscription: true,
        plan_tier: planTier,
        user_id: userId,
    },
};

const result = await preference.create({ body: preferenceBody });
// Redirigir al usuario a: result.init_point
```

#### 2. Webhook para Activar Suscripciones

**Endpoint:** `/api/webhooks/mercadopago`

```typescript
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'payment') {
        // Obtener detalles del pago
        const payment = await fetchPaymentDetails(data.id);
        
        // Verificar si es una suscripción
        if (payment.external_reference?.includes('subscription')) {
            const [userId, planTier] = payment.external_reference.split('|');
            
            if (payment.status === 'approved') {
                // Activar suscripción
                await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        tier: planTier,
                        status: 'active',
                        next_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        last_payment_id: payment.id.toString(),
                    });
            }
        }
    }
    
    return NextResponse.json({ received: true });
}
```

#### 3. Configurar Webhook en Mercado Pago

1. Ir a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Seleccionar tu aplicación
3. Ir a "Webhooks"
4. Agregar URL: `https://fvenwgmdwzybkdixzlxw.supabase.co/functions/v1/mercadopago-webhook`
5. **IMPORTANTE:** Seleccionar **solo** el evento:
   - `[x] Pagos` (Payments)
   
   ⚠️ **NO** seleccionar "Planes y suscripciones" (Plans and subscriptions), ya que estamos usando Checkout Pro (Preferences), no PreApproval.

---

## 🔧 Configuración de Ambiente

### Variables de Entorno

```bash
# Mercado Pago
ML_SITE_ID=MLA  # MLA para Argentina, MLB para Brasil
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# En tu base de datos de settings
mp_mode=test  # o 'production'
mp_test_access_token=APP_USR-...
mp_prod_access_token=APP_USR-...
```

### Base de Datos (Supabase)

```sql
-- Tabla de suscripciones
CREATE TABLE subscriptions (
    user_id TEXT PRIMARY KEY,
    tier TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'active', 'failed', 'cancelled'
    mp_subscription_id TEXT,
    next_renewal_date TIMESTAMP,
    last_payment_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing en Sandbox

### 1. Crear Cuenta de Prueba

1. Ir a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crear cuenta de prueba de **Vendedor** para Argentina (MLA)
3. Obtener credenciales de producción de esa cuenta de prueba

### 2. Tarjetas de Prueba

Para Argentina (MLA):
- **Aprobada:** `5031 7557 3453 0604` (Mastercard)
- **CVV:** 123
- **Vencimiento:** Cualquier fecha futura
- **Titular:** APRO (para aprobado)

### 3. Flujo de Prueba

1. Configurar `mp_mode=test`
2. Usar credenciales de la cuenta de prueba
3. Seleccionar un plan
4. Completar pago con tarjeta de prueba
5. Verificar redirección exitosa
6. Verificar que el webhook activó la suscripción

---

## 📋 Checklist de Implementación

- [ ] Configurar variables de entorno
- [ ] Crear tabla de suscripciones en la base de datos
- [ ] Implementar función `createSubscriptionPreference`
- [ ] Crear endpoint de webhook `/api/webhooks/mercadopago`
- [ ] Configurar webhook en Mercado Pago dashboard
- [ ] Crear cuenta de prueba de vendedor
- [ ] Probar flujo completo en sandbox
- [ ] Verificar que el webhook activa suscripciones
- [ ] Implementar lógica de renovación (opcional)
- [ ] Cambiar a modo producción

---

## 🎓 Lecciones Aprendidas

### 1. Siempre Empezar con Checkout Pro

Para nuevos proyectos, **comenzar con Checkout Pro** es la mejor opción:
- Más estable
- Mejor documentación
- Más fácil de debuggear
- Funciona perfectamente en test mode

### 2. Test Mode Requiere Cuidado Especial

- Usar emails de prueba genéricos
- No mezclar datos reales con credenciales de test
- Verificar que el país de la cuenta coincida con `siteId`

### 3. Webhooks son Esenciales

Los webhooks son la única forma confiable de confirmar pagos:
- No confiar solo en la redirección del usuario
- Siempre verificar el estado del pago en el webhook
- Implementar idempotencia (verificar `last_payment_id`)

### 4. Logging es Crítico

Implementar logging detallado desde el inicio:
```typescript
console.log('[MP Preference] Final Body:', JSON.stringify(preferenceBody, null, 2));
console.log('[MP Webhook] Payment details:', { id, status, external_reference });
```

### 5. External Reference es tu Amigo

Usar `external_reference` para:
- Identificar el tipo de transacción (`subscription`, `one-time`, etc.)
- Asociar pagos con usuarios y planes
- Debugging y reconciliación

---

## 🔄 Migración de PreApproval a Checkout Pro

Si ya tienes PreApproval implementado:

1. **Cambiar import:**
   ```typescript
   // Antes
   import { PreApproval } from 'mercadopago';
   // Después
   import { Preference } from 'mercadopago';
   ```

2. **Cambiar estructura del payload:**
   ```typescript
   // Antes (PreApproval)
   {
       reason: "Plan X",
       auto_recurring: { ... },
       payer_email: "...",
   }
   
   // Después (Preference)
   {
       items: [{ title, quantity, unit_price, currency_id }],
       payer: { email },
       back_urls: { success, failure, pending },
       external_reference: "...",
   }
   ```

3. **Actualizar webhook** para procesar pagos únicos en lugar de suscripciones automáticas

---

## 📞 Recursos Adicionales

- [Documentación Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [API Reference - Preferences](https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post)
- [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)

---

## 🎉 Resultado Final

Con esta implementación logras:
- ✅ Flujo de suscripción funcional
- ✅ Pagos procesados correctamente en test y producción
- ✅ Activación automática vía webhooks
- ✅ Sistema escalable y mantenible
- ✅ Excelente experiencia de usuario

**Tiempo de implementación:** ~4 horas (incluyendo debugging)
**Complejidad:** Media
**Mantenibilidad:** Alta
