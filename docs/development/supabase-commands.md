# 🚀 Guía Rápida de Comandos Supabase

## 📦 Scripts npm disponibles

```bash
# Desarrollo local (requiere Docker)
npm run db:start      # Inicia Supabase local
npm run db:stop       # Detiene Supabase local
npm run db:reset      # Resetea DB local con migraciones
npm run db:status     # Ver estado de Supabase local

# Migraciones
npm run db:migration add_user_settings  # Crear nueva migración
npm run db:diff new_changes             # Generar diff automático
npm run db:push                         # Aplicar migraciones a remoto
npm run db:pull                         # Traer schema desde remoto
```

## 🔄 Workflow Típico

### 1. Primera vez (Setup inicial)

```bash
# Crear proyecto en Supabase Dashboard
# Luego vincular:
supabase login
supabase link --project-ref TU_PROJECT_ID

# Aplicar migraciones iniciales
npm run db:push
```

### 2. Desarrollo local (opcional, requiere Docker)

```bash
# Iniciar Supabase local
npm run db:start

# Tu app usará la DB local automáticamente
# URL: http://localhost:54321
# Anon key: se muestra en la terminal

# Cuando termines
npm run db:stop
```

### 3. Crear nueva feature con cambios en DB

```bash
# Opción A: Crear migración manualmente
npm run db:migration add_notifications_table

# Editar: supabase/migrations/TIMESTAMP_add_notifications_table.sql
# Escribir tu SQL

# Opción B: Generar diff automático (requiere DB local)
npm run db:start
# Hacer cambios en DB local via Studio (http://localhost:54323)
npm run db:diff add_notifications_table
```

### 4. Aplicar cambios a producción

```bash
# Opción 1: Manual
npm run db:push

# Opción 2: Automático via GitHub Actions
git add supabase/migrations/
git commit -m "feat: add notifications table"
git push origin main
# GitHub Actions ejecutará las migraciones automáticamente
```

## 🔍 Comandos útiles

```bash
# Ver todas las migraciones aplicadas
supabase migration list

# Ver diferencias entre local y remoto
supabase db diff

# Generar tipos TypeScript desde el schema
supabase gen types typescript --local > src/types/supabase.ts

# Ver logs de la DB
supabase db logs
```

## 🐛 Troubleshooting

**Error: "Docker not running"**
```bash
# Instalar Docker Desktop para Mac
# https://www.docker.com/products/docker-desktop
```

**Error: "Project not linked"**
```bash
supabase link --project-ref TU_PROJECT_ID
```

**Error: "Migration already exists"**
```bash
# Las migraciones se ejecutan en orden por timestamp
# No puedes tener dos con el mismo nombre
```

## 📚 Recursos

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/managing-environments)
