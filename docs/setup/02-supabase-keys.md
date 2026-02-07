# 🔑 Guía de Claves de Supabase (2026)

## ⚠️ Importante: Nuevas Claves vs Legacy

Supabase está migrando de las claves legacy a un nuevo sistema más seguro:

| Tipo | Legacy (Deprecado 2026) | Nuevo (Usar este) |
|------|------------------------|-------------------|
| **Cliente** | `anon` key (JWT) | `sb_publishable_...` |
| **Servidor** | `service_role` key | `sb_secret_...` |

---

## 📍 Dónde Encontrar las Claves en el Dashboard

### Paso 1: Ir a Settings → API

1. En Supabase Dashboard, click en **⚙️ Settings** (sidebar izquierdo)
2. Click en **"API"**

### Paso 2: Copiar las NUEVAS claves

En la sección **"API Keys"**, verás dos tipos de claves:

#### ✅ Claves NUEVAS (Usar estas)

```
Publishable key (client-side)
sb_publishable_abcdefghijklmnopqrstuvwxyz1234567890...
```
👆 Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```
Secret key (server-side)
sb_secret_abcdefghijklmnopqrstuvwxyz1234567890...
```
👆 Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (solo para backend)

#### ⚠️ Claves LEGACY (NO usar)

Si ves estas, ignóralas:
- `anon` key (empieza con `eyJhbG...`)
- `service_role` key (empieza con `eyJhbG...`)

Estas serán eliminadas en **late 2026**.

---

## 🔧 Configuración en `.env.local`

```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://tu-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

---

## ❓ FAQ

**P: ¿Qué pasa si mi proyecto solo muestra las claves legacy?**

R: Los proyectos creados antes de junio 2025 pueden no tener las nuevas claves habilitadas. Opciones:
1. En Settings → API, busca un botón "Enable new API keys"
2. O usa las legacy por ahora (funcionarán hasta late 2026)

**P: ¿Puedo usar ambas claves al mismo tiempo?**

R: Sí, durante el período de transición ambas funcionan. Pero se recomienda migrar a las nuevas.

**P: ¿Las nuevas claves son más seguras?**

R: Sí, porque:
- Se pueden rotar independientemente
- Soportan JWTs asimétricos (RSA)
- Mejor auditoría y scoping

---

## 🔄 Migración desde Legacy

Si ya tienes un proyecto con claves legacy:

1. Ve a Settings → API
2. Busca la sección "New API Keys"
3. Copia las nuevas claves `sb_publishable_...` y `sb_secret_...`
4. Actualiza tu `.env.local`
5. Reinicia tu servidor

**No hay cambios de código necesarios** - `@supabase/supabase-js` v2.95+ soporta ambas.

---

## 📚 Referencias

- [Supabase API Keys Migration Guide](https://supabase.com/docs/guides/api/api-keys)
- [New Authentication System](https://supabase.com/blog/new-api-keys)
