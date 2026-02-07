# 🗺️ Roadmap de Implementación - Post-Review

## ✅ Fase 0: Completado (Hoy)
- [x] Setup Next.js + Clerk + Shadcn
- [x] Cliente de API de Mercado Libre
- [x] Algoritmo de scoring básico
- [x] Dashboard UI con Sidebar
- [x] Buscador de Nichos (versión inicial)
- [x] Landing page

## 🔧 Fase 1: Estabilización Crítica (Días 1-3)

### Prioridad ALTA
1. **Corregir Algoritmo de Scoring** [4 horas]
   - ✅ Implementar normalización por percentiles
   - ✅ Agregar stop words en español
   - ✅ Fallback cuando `sold_quantity` es null
   - ✅ Filtrar nichos con <2 productos
   - Archivo: `/src/lib/mercadolibre/niches-improved.ts` (ya creado)

2. **Autenticación en Server Actions** [1 hora]
   ```typescript
   // src/actions/mercadolibre.ts
   import { auth } from '@clerk/nextjs/server';
   
   export async function searchNichesAction(categoryId: string) {
     const { userId } = await auth();
     if (!userId) throw new Error('Unauthorized');
     // ... resto
   }
   ```

3. **Schemas de Supabase** [2 horas]
   - Crear tablas: `searches`, `favorite_niches`, `ml_tokens`
   - Migrar a usar `niches-improved.ts` en lugar de `niches.ts`
   - Guardar cada búsqueda en Supabase

### Prioridad MEDIA
4. **Selector de Categorías Visual** [3 horas]
   - Componente `CategorySelector` con las 20 categorías principales
   - Autocompletado con búsqueda

5. **Mejoras de UX en NicheCard** [2 horas]
   - Badges visuales (Top 10%, Rising, Competitive)
   - Tooltips explicativos en cada métrica
   - Iconos de emojis en la explicación

## 🚀 Fase 2: Features Core (Días 4-7)

### Persistencia y Favoritos
6. **Guardar Búsquedas** [3 horas]
   - Al hacer búsqueda, guardar en `searches` table
   - Mostrar historial en Dashboard

7. **Sistema de Favoritos** [4 horas]
   - Botón "Guardar Nicho" en NicheCard
   - Página `/dashboard/favorites`
   - Vista de nichos guardados con trending

### Analizador de Producto
8. **Migrar Lógica de Análisis** [6 horas]
   - Portar `products.service.ts` del POC
   - Crear `ProductAnalyzer` class
   - Server Action `analyzeProductAction`
   - UI para mostrar análisis (scores de título, descripción, etc.)

## 🤖 Fase 3: IA & Monetización (Días 8-14)

### Generación de Campañas
9. **Integración OpenAI** [5 horas]
   - Setup OpenAI SDK
   - Prompt engineering para títulos optimizados
   - Prompt para descripciones AIDA
   - Server Action `generateCampaignAction`

10. **UI del Generador** [4 horas]
    - Página `/dashboard/campaigns/new`
    - Form: Nicho + Características del producto
    - Vista previa en tiempo real
    - Guardar campañas en Supabase

### Billing con Stripe
11. **Setup Stripe** [6 horas]
    - Crear productos en Stripe Dashboard
    - Free: 5 búsquedas/mes, 1 campaña
    - Pro: Ilimitado, $19/mes
    - Implementar checkout flow
    - Webhook para sincronizar con Supabase

12. **Rate Limiting** [3 horas]
    - Verificar plan del usuario antes de cada acción
    - Middleware para Server Actions
    - Mostrar límites en UI

## 🎨 Fase 4: Polish & Launch (Días 15-21)

### Final Touches
13. **Landing Page Mejorada** [4 horas]
    - Sección de pricing
    - Video demo
    - Testimonios (seed data)
    - CTA optimizado

14. **SEO & Performance** [3 horas]
    - Metadata completo
    - Sitemap.xml
    - Optimizar imágenes
    - Lazy loading

15. **Testing E2E** [5 horas]
    - Playwright tests para flujos críticos
    - Test de búsqueda de nichos
    - Test de generación de campaña
    - Test de checkout

16. **Monitoring & Analytics** [3 horas]
    - Vercel Analytics
    - Sentry para error tracking
    - PostHog para product analytics

### Deployment
17. **Deploy a Producción** [2 horas]
    - Configurar variables en Vercel
    - Setup dominio
    - SSL Certificate
    - Primera release 🎉

## 📊 Métricas de Éxito (Post-Launch)

- **Día 1-7**: 100 signups
- **Conversión Free → Pro**: 5%
- **Retención D7**: 40%
- **NPS**: >50

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| ML API rate limit | Alta | Alto | Caché agresivo + Upstash Redis |
| Scoring no se alinea con realidad | Media | Alto | A/B test de fórmulas + feedback users |
| OpenAI genera contenido pobre | Media | Medio | Prompt engineering + human review |
| Usuarios no convierten a Pro | Media | Alto | Free trial de Pro por 7 días |

## 🔄 Backlog (Post-MVP)

- Integración directa con ML para publicar (requiere OAuth)
- Scraping de reviews para insights
- Análisis de competencia profundo
- Recomendaciones personalizadas con ML
- Plan Enterprise para agencias

---

## 📝 Notas Técnicas

### Stack Confirmado
- **Frontend**: Next.js 15 (App Router)
- **Auth**: Clerk
- **DB**: Supabase (PostgreSQL)
- **UI**: Shadcn/ui + Tailwind
- **IA**: OpenAI (gpt-4o-mini)
- **Billing**: Stripe
- **Deploy**: Vercel
- **Monitoring**: Sentry + Vercel Analytics

### Costos Estimados (100 MAU)
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- OpenAI: ~$50/mes (500 generaciones)
- Clerk: Gratis (hasta 10k)
- Stripe: 2.9% + $0.30/transacción
- **Total**: ~$100/mes + comisiones

### Próximo Paso Inmediato
**Reemplazar `niches.ts` con `niches-improved.ts` en toda la app**
