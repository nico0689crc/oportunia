# 🚀 Configuración Profesional de Supabase con CI/CD

Esta guía configura Supabase con migraciones automáticas, control de versiones y CI/CD.

## 📋 Requisitos Previos

- [ ] Cuenta en Supabase
- [ ] Proyecto creado en Supabase Dashboard
- [ ] Supabase CLI instalado

---

## Paso 1: Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Verificar instalación
supabase --version
```

---

## Paso 2: Inicializar Supabase en el Proyecto

```bash
# Desde la raíz del proyecto
supabase init
```

Esto crea:
- `supabase/` - Directorio de configuración
- `supabase/migrations/` - Migraciones SQL versionadas
- `supabase/config.toml` - Configuración del proyecto

---

## Paso 3: Vincular con tu Proyecto Remoto

```bash
# Login en Supabase
supabase login

# Vincular con tu proyecto
supabase link --project-ref TU_PROJECT_ID
```

**¿Dónde encuentro el PROJECT_ID?**
- Dashboard de Supabase → Project Settings → General
- Es el ID corto (ej: `abcdefghijklmnop`)

---

## Paso 4: Crear la Primera Migración

```bash
# Crear migración inicial con el schema existente
supabase db diff --use-migra -f initial_schema
```

Esto genera un archivo en `supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql`

**Alternativamente**, mueve el schema existente:

```bash
# Mover el schema.sql a migrations
mv supabase/schema.sql supabase/migrations/20260207000000_initial_schema.sql
```

---

## Paso 5: Aplicar Migraciones al Proyecto Remoto

```bash
# Push de las migraciones a Supabase
supabase db push
```

Esto ejecuta todas las migraciones pendientes en tu base de datos remota.

---

## Paso 6: Configurar Variables de Entorno

### Paso 6.1: Obtener las Credenciales

1. **En el Dashboard de Supabase**, ve a **Project Settings** → **API**
2. **Copia estos valores**:

   - **Project URL**: 
     ```
     https://xxxxxxxxxxxxx.supabase.co
     ```
   
   - **Publishable key** (⚠️ NUEVA - usa esta, NO la "anon" key):
     ```
     sb_publishable_xxxxxxxxxxxxxxxxxxxxx...
     ```

**⚠️ Importante sobre las claves:**
- Si ves claves que empiezan con `sb_publishable_...` → **Usa esas (nuevas)**
- Si solo ves claves que empiezan con `eyJhbG...` → Son legacy, funcionan pero se deprecarán en 2026
- Ver guía detallada: [`docs/setup/02-supabase-keys.md`](./02-supabase-keys.md)

### Paso 6.2: Crear archivo `.env.local`

Crea un archivo `.env.local` con las credenciales obtenidas:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxx...
```

---

## Paso 7: Configurar GitHub Actions (CI/CD)

Crea `.github/workflows/supabase-migrations.yml`:

```yaml
name: Supabase Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db push
```

**Configurar Secrets en GitHub**:
1. GitHub Repo → Settings → Secrets and variables → Actions
2. Agregar:
   - `SUPABASE_ACCESS_TOKEN` (de Supabase Dashboard → Account → Access Tokens)
   - `SUPABASE_PROJECT_ID` (tu project ID)
   - `SUPABASE_DB_PASSWORD` (contraseña de la DB)

---

## Paso 8: Workflow de Desarrollo

### Crear una nueva migración:

```bash
# Opción 1: Crear archivo manualmente
supabase migration new add_user_preferences

# Opción 2: Generar diff automático (requiere DB local)
supabase db diff -f add_user_preferences
```

### Aplicar migraciones localmente:

```bash
# Levantar Supabase local (Docker requerido)
supabase start

# Aplicar migraciones
supabase db reset
```

### Aplicar a producción:

```bash
# Opción 1: Manual
supabase db push

# Opción 2: Automático (via GitHub Actions)
git add supabase/migrations/
git commit -m "feat: add user preferences table"
git push origin main
```

---

## 📁 Estructura Final

```
04-mvp-saas/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260207000000_initial_schema.sql
│   │   └── 20260207120000_add_user_preferences.sql
│   └── seed.sql (opcional - datos de prueba)
├── .github/
│   └── workflows/
│       └── supabase-migrations.yml
└── .env.local
```

---

## ✅ Ventajas de este Setup

- ✅ **Control de versiones**: Todas las migraciones en Git
- ✅ **Rollback fácil**: Puedes revertir migraciones
- ✅ **CI/CD automático**: Deploy automático al hacer push
- ✅ **Entorno local**: Puedes desarrollar sin conexión
- ✅ **Colaboración**: Múltiples devs pueden trabajar sin conflictos
- ✅ **Auditoría**: Historial completo de cambios en la DB

---

## 🐛 Troubleshooting

**Error: "supabase: command not found"**
```bash
# Verificar instalación
which supabase

# Reinstalar si es necesario
brew reinstall supabase/tap/supabase
```

**Error: "Project not linked"**
```bash
# Re-vincular
supabase link --project-ref TU_PROJECT_ID
```

**Error en GitHub Actions**
- Verifica que los secrets estén configurados
- Revisa los logs en Actions tab

---

## 📚 Recursos

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [GitHub Actions](https://supabase.com/docs/guides/cli/github-action)

---

**Próximo paso**: Ejecutar `supabase init` en tu proyecto.
