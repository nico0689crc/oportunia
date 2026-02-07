# 💳 Configuración de Clerk Billing para Oportunia

Esta guía detalla cómo configurar los planes y características en el Dashboard de Clerk para que coincidan con la lógica de negocio de Oportunia.

## 1. Habilitar Entorno
1. Ve a **Clerk Dashboard** → **Billing**.
2. Selecciona el **Stripe development gateway** para pruebas.

## 2. Definir Características (Features)
En la sección **Billing → Features**, crea los slugs para cada funcionalidad. 

> [!NOTE]
> En este paso **no** verás opciones de "Límite" o "Booleano". Solo creas el nombre/identificador. Los límites se definen después, al editar cada Plan.

| Feature Name | Key (Código) | Uso Sugerido |
|--------------|--------------|-------------|
| Búsqueda de Nichos | `niche_search` | Para limitar búsquedas. |
| Análisis con IA | `ai_analysis` | Para limitar análisis. |
| Campañas con IA | `ai_campaigns` | Para limitar generaciones. |
| Monitoreo de Productos | `product_monitor` | Para limitar tracking. |
| Alertas Real-time | `realtime_alerts` | Como acceso Sí/No. |

## 3. Configurar Planes e Inyectar Valores
Ahora ve a **Billing → Plans**. Al crear o editar un Plan, añade las "Features" anteriores y ahí es donde definirás los **Valores**:

### **Plan 1: Cazador (Gratis)**
- **Precio**: $0
- **Features**:
  - `niche_search`: 5
  - `ai_analysis`: 3
  - `ai_campaigns`: 1
  - `product_monitor`: 1

### **Plan 2: Vendedor (Pro)**
- **Precio Sugerido**: $19 - $29 / mes
- **Features**:
  - `niche_search`: 50
  - `ai_analysis`: 30
  - `ai_campaigns`: 15
  - `product_monitor`: 20
  - `realtime_alerts`: true

### **Plan 3: Dominador (Elite)**
- **Precio Sugerido**: $79 - $99 / mes
- **Features**:
  - `niche_search`: Ilimitado
  - `ai_analysis`: Ilimitado
  - `ai_campaigns`: Ilimitado
  - `product_monitor`: Ilimitado
  - `realtime_alerts`: true

## 4. Implementación en el Código (Frontend)

Para verificar si un usuario tiene acceso a una característica:

```typescript
import { auth } from '@clerk/nextjs';

export default function Page() {
  const { has } = auth();

  const canAnalyze = has({ permission: "ai_analysis" });

  if (!canAnalyze) {
    return <UpgradePrompt />;
  }

  return <AnalyzerComponent />;
}
```

## 5. Webhook Sync
Asegúrate de que tu `clerk-webhook` esté escuchando los eventos de `subscription.*` para actualizar el estado del usuario en Supabase si es necesario.
