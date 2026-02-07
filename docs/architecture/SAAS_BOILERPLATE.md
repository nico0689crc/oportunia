# SaaS Boilerplate Architecture & Best Practices

Este proyecto ha sido diseñado para servir como base sólida para cualquier aplicación SaaS moderna (Software as a Service). A continuación se documentan las decisiones arquitectónicas clave y las lecciones aprendidas.

## 🛠️ Stack Tecnológico Premium

| Componente | Tecnología | Razón de Elección |
|------------|------------|-------------------|
| **Frontend** | Next.js 16 (App Router) | Mejor performance (RSC), SEO out-of-the-box y DX superior. |
| **Auth** | Clerk | Seguridad de nivel empresarial, MFA, y gestión de usuarios sin esfuerzo. |
| **Database** | Supabase (PostgreSQL) | DB relacional potente con RLS para seguridad y gran ecosistema de herramientas. |
| **Type Safety** | TypeScript 5 | Prevención de errores en tiempo de compilación y mejor autocompletado. |
| **Styling** | Tailwind CSS 4 | Sistema de diseño atómico, extremadamente rápido y escalable. |
| **CI/CD** | GitHub Actions | Automatización total de tests, linting y despliegues sincronizados. |

## 📐 Patrones Arquitectónicos

### 1. Integración Clerk + Supabase (RLS)
Utilizamos **Row Level Security (RLS)** en Supabase para garantizar que los usuarios solo accedan a sus propios datos.
- **Identificación**: Usamos `auth.jwt() ->> 'sub'` para comparar el ID de Clerk con el `user_id` de las tablas.
- **Acceso Administrativo**: Para operaciones de sistema (background jobs), usamos una instancia de `supabaseAdmin` con el `SERVICE_ROLE_KEY`.

### 2. Clerk (Authentication)
Toda mutación de datos se maneja vía Server Actions:
- **Validación**: Usamos `zod` para validar el input en el servidor.
- **Seguridad**: Validamos la sesión del usuario con `auth()` de Clerk antes de ejecutar cualquier lógica.

### 3. Cliente de API Unificado
Para integraciones externas (como Mercado Libre), usamos una clase `MlClient` basada en `axios`:
- **Tipado**: Tipamos todas las respuestas para evitar `any`.
- **Axios Tipado**: Aprendimos que no se debe usar `@types/axios` en versiones modernas, ya que `axios` trae sus propios tipos.

## 🚀 Pipeline de CI/CD Optimizado

El workflow en `.github/workflows/pipeline.yml` no solo construye la app, sino que valida la integridad de la base de datos:

- **Validación de SQL**: Ejecutamos `supabase db lint`.
- **Sincronización Local**: Para que `lint` funcione, el pipeline levanta una instancia local de Supabase (`supabase start`) dentro de Docker en el runner de GitHub Actions.
- **Auto-Migración**: El pipeline asegura que las migraciones se apliquen en orden y que el schema remoto siempre esté sincronizado.

## 💡 Lecciones Aprendidas (Gotchas)

> [!IMPORTANT]
> **Conflictos de Tipos en Axios**: Eliminar siempre `@types/axios` si se usa `axios >= 0.21.0`. Los tipos duplicados causan errores de compilación difíciles de trackear.

> [!TIP]
> **Linting de DB en CI**: Siempre iniciar la base de datos local (`supabase start`) antes de linterear SQL. De lo contrario, recibirás un error de "connection refused".

> [!WARNING]
> **Server vs Client Components**: Mantener las Server Actions en archivos separados con el directive `"use server"` para evitar fugas de secretos al cliente.

## ⚡ Edge Functions & Suscripciones (Webhooks)

Para Oportunia usamos un sistema de pagos personalizado con **Mercado Pago** y **Supabase** para gestionar los beneficios de cada plan.

### 1. Sincronización con Mercado Pago (`mercadopago-webhook`)
Este es el punto que actualiza los permisos del usuario.
- **Eventos**: `payment`.
- **Lógica**: La función valida el pago con la API de MP y actualiza la tabla `subscriptions` en Supabase.
- **Seguridad**: Se requiere el `MP_ACCESS_TOKEN` configurado como secreto en Supabase.

### 2. Gestión de Usuarios (`clerk-webhook`)
Usamos Clerk para la autenticación. Este webhook solo sincroniza la creación de usuarios para asegurar que tengan un perfil en nuestra base de datos.
- **Eventos**: `user.created`.
- **Seguridad**: Requiere `CLERK_WEBHOOK_SECRET`.

### 🛑 Comandos de Despliegue
```bash
# Desplegar la lógica central de Clerk
supabase functions deploy clerk-webhook

# Configurar el secreto de Clerk
supabase secrets set CLERK_WEBHOOK_SECRET=wh_...
```

## 🛡️ Control de Calidad (Git Hooks)

Para evitar subir código roto, el boilerplate utiliza **Husky** y **lint-staged**:

- **Pre-commit**: Ejecuta `eslint` solo en los archivos modificados. Si hay errores, el commit se bloquea.
- **Pre-push**: Ejecuta `lint`, `typecheck` y `build` completos. Garantiza que nada rompa el pipeline de CI.

## 💰 Arquitectura de Precios & Entitlements

El boilerplate utiliza un modelo de **Entitlements Centric**, donde el acceso no se basa en el nombre del plan, sino en las características individuales (Features).

### 1. Control de Acceso (RBAC + Features)
- **Granularidad**: Usamos las "Features" de Clerk para definir límites y permisos.
- **Chequeo en Cliente/Servidor**: Se utiliza `auth().has()` para una validación instantánea y tipada.

### 2. Sincronización de Suscripciones
- **Mercado Pago Webhook**: La función `mercadopago-webhook` recibe las notificaciones de pago.
- **Supabase as Source of Truth**: A diferencia de Clerk Billing, aquí los planes viven en la tabla `subscriptions` de Supabase. El frontend debe consultar esta tabla para validar el acceso.

---
**Este documento es la base para futuros proyectos SaaS. Mantenerlo actualizado con cada nueva mejora estructural.**
