# 🔐 Guía de Configuración - Variables de Entorno

## ⚠️ Error Actual: Clerk Invalid Key

Estás viendo este error porque las credenciales de Clerk son placeholders. Sigue estos pasos:

---

## 1️⃣ Configurar Clerk (URGENTE - Necesario para que funcione)

### Paso A: Crear cuenta en Clerk

1. Ve a [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up)
2. Crea una cuenta gratuita
3. Crea una nueva aplicación:
   - Name: "Oportunia"
   - Sign-in options: Email (y Google si quieres)

### Paso B: Copiar las credenciales

1. En el Dashboard de Clerk, ve a **API Keys**
2. Verás dos keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (empieza con `pk_test_...`)
   - `CLERK_SECRET_KEY` (empieza con `sk_test_...`)

### Paso C: Actualizar `.env.local`

Abre el archivo `/Users/nico/Documents/Proyectos/proyectos-sass/04-mvp-saas/.env.local` y reemplaza:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_TU_KEY_REAL_AQUI
CLERK_SECRET_KEY=sk_test_TU_SECRET_REAL_AQUI
```

⚠️ **IMPORTANTE**: Asegúrate de copiar la key COMPLETA, no debe terminar en `...`

### Paso D: Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
```

### ✅ Archivos de Clerk ya creados

Ya he creado todos los archivos necesarios para Clerk:
- ✅ `src/middleware.ts` - Protege las rutas
- ✅ `src/app/sign-in/[[...sign-in]]/page.tsx` - Página de login
- ✅ `src/app/sign-up/[[...sign-up]]/page.tsx` - Página de registro
- ✅ `src/app/layout.tsx` - ClerkProvider configurado

Solo necesitas agregar tus credenciales en `.env.local`.

---

## 2️⃣ Configurar Supabase (Opcional para comenzar)

Puedes omitir esto inicialmente. La app funcionará sin Supabase, pero no guardará búsquedas.

### Si quieres configurarlo:

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Crea un proyecto nuevo (gratis)
3. Copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Ve a **SQL Editor** y ejecuta el archivo `supabase/schema.sql`

---

## 3️⃣ Configurar Mercado Libre API (Opcional para comenzar)

Puedes usar valores de prueba por ahora. La API pública de ML funciona sin autenticación para búsquedas.

### Si quieres vincular tu cuenta:

1. Ve a [https://developers.mercadolibre.com.ar/apps](https://developers.mercadolibre.com.ar/apps)
2. Crea una aplicación
3. Copia el Client ID y Secret

---

## 4️⃣ Configurar OpenAI (Para generación de campañas - Futuro)

Esto lo necesitarás cuando implementemos la generación de contenido con IA.

---

## 🚀 Resumen: Lo Mínimo para Empezar

**Solo necesitas Clerk para que funcione ahora:**

1. ✅ Crear cuenta en Clerk
2. ✅ Copiar las 2 keys
3. ✅ Pegarlas en `.env.local`
4. ✅ Reiniciar `npm run dev`

El resto (Supabase, ML, OpenAI) puede configurarse después.

---

## 💡 Tip: Verificar que funcionó

Después de configurar Clerk, verás:
- La landing page sin errores
- Botón "Ingresar" y "Empezar Gratis" funcionando
- Puedes crear una cuenta y loguearte
- Acceso al dashboard protegido

---

## ❓ ¿Problemas?

**Error: "Publishable key invalid"**
- Copiaste la key completa (no debe terminar en `...`)
- Reiniciaste el servidor después de cambiar `.env.local`

**Error: "Cannot find module @clerk/nextjs"**
- Ejecuta `npm install` de nuevo

**Dashboard redirige a /sign-in constantemente**
- Verifica que las URLs de redirección en `.env.local` coincidan con las de Clerk Dashboard
