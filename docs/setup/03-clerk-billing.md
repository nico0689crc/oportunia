# 💳 Configuración de Clerk Billing para Oportunia

Esta guía detalla cómo configurar los planes y características en el Dashboard de Clerk para que coincidan con la lógica de negocio de Oportunia.

## 1. Habilitar Entorno
1. Ve a **Clerk Dashboard** → **Billing**.
2. Selecciona el **Stripe development gateway** para pruebas.

## 2. Definir Características (Features)
Antes de crear los planes, define las "Features" que controlarán el acceso en el código.

| Feature Name | Key (Código) | Tipo | Descripción |
|--------------|--------------|------|-------------|
| Búsqueda de Nichos | `niche_search` | Límite | Cantidad de búsquedas permitidas. |
| Análisis con IA | `ai_analysis` | Límite | Análisis de productos ganadores. |
| Campañas con IA | `ai_campaigns` | Límite | Generación de títulos/descripciones. |
| Monitoreo de Productos | `product_monitor` | Límite | Productos en tracking activo. |
| Alertas Real-time | `realtime_alerts` | Booleano | Acceso a alertas instantáneas. |

## 3. Configurar Planes

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
