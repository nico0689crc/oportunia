# 🚀 Deployment a Producción

## Vercel (Recomendado)

### Paso 1: Conectar Repositorio

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará Next.js automáticamente

### Paso 2: Configurar Variables de Entorno

En Vercel Dashboard → Project Settings → Environment Variables, agrega:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# Mercado Libre
ML_CLIENT_ID=...
ML_CLIENT_SECRET=...
ML_REDIRECT_URI=https://tu-dominio.vercel.app/api/auth/ml/callback
ML_SITE_ID=MLA
```

### Paso 3: Deploy

```bash
# Desde tu terminal
vercel

# O simplemente push a main
git push origin main
```

Vercel desplegará automáticamente.

---

## Configuración de Dominio Personalizado

1. Vercel Dashboard → Domains
2. Agregar dominio: `oportunia.com`
3. Configurar DNS según instrucciones

---

## CI/CD con GitHub Actions

El workflow en `.github/workflows/supabase-migrations.yml` se ejecutará automáticamente al hacer push a `main`.

Asegúrate de configurar los secrets en GitHub:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PRODUCTION_PROJECT_ID`
- `SUPABASE_PRODUCTION_DB_PASSWORD`

---

## Monitoreo

### Vercel Analytics

Habilitado automáticamente. Ve a:
- Vercel Dashboard → Analytics

### Sentry (Opcional)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Checklist Pre-Deploy

- [ ] Todas las variables de entorno configuradas
- [ ] Migraciones de Supabase aplicadas
- [ ] Build local exitoso (`npm run build`)
- [ ] Tests pasando (cuando estén implementados)
- [ ] README actualizado
- [ ] Dominio configurado
