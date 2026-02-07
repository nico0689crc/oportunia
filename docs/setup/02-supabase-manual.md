# 🗄️ Guía de Configuración de Supabase

## Paso 1: Crear Proyecto en Supabase

1. **Ve a** [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Inicia sesión** o crea una cuenta (gratis)
3. **Click en "New Project"**
   - Organization: Selecciona o crea una
   - Name: `oportunia-mvp` (o el nombre que prefieras)
   - Database Password: **Guarda esta contraseña** (la necesitarás)
   - Region: `South America (São Paulo)` (más cercano a Argentina)
   - Plan: Free (suficiente para empezar)
4. **Click en "Create new project"**
   - Espera ~2 minutos mientras se crea

---

## Paso 2: Ejecutar el Schema SQL

Una vez que el proyecto esté listo:

1. **En el sidebar izquierdo**, click en **"SQL Editor"**
2. **Click en "New query"**
3. **Abre el archivo** `supabase/schema.sql` de tu proyecto
4. **Copia TODO el contenido** del archivo
5. **Pégalo en el editor SQL** de Supabase
6. **Click en "Run"** (botón verde abajo a la derecha)
7. **Verifica** que diga "Success. No rows returned" (es normal)

### ✅ Qué hace este schema:

El schema crea 4 tablas:
- `searches` - Historial de búsquedas de nichos
- `favorite_niches` - Nichos guardados como favoritos
- `ml_tokens` - Tokens OAuth de Mercado Libre (futuro)
- `generated_campaigns` - Campañas generadas con IA (futuro)

También configura **Row Level Security (RLS)** para que cada usuario solo vea sus propios datos.

---

## Paso 3: Copiar las Credenciales

1. **En el sidebar**, click en **"Project Settings"** (ícono de engranaje)
2. **Click en "API"** en el menú izquierdo
3. **Copia estos valores**:

   - **Project URL**: 
     ```
     https://xxxxxxxxxxxxx.supabase.co
     ```
   
   - **anon/public key** (en la sección "Project API keys"):
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

---

## Paso 4: Actualizar `.env.local`

Abre tu archivo `.env.local` y actualiza estas líneas:

```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: 
- Copia la URL completa (con `https://`)
- Copia la key completa (es muy larga, ~200 caracteres)
- NO uses la `service_role` key (es solo para backend seguro)

---

## Paso 5: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
```

---

## ✅ Verificar que Funciona

Después de reiniciar:

1. **Ve al Buscador de Nichos** (`/dashboard/niches`)
2. **Haz una búsqueda** (ej: categoría `MLA1051`)
3. **Ve a Supabase Dashboard** → **Table Editor** → **searches**
4. **Deberías ver tu búsqueda guardada** 🎉

---

## 🐛 Troubleshooting

**Error: "Invalid API key"**
- Verifica que copiaste la key completa
- Asegúrate de usar la `anon` key, no la `service_role`

**Error: "relation does not exist"**
- El schema no se ejecutó correctamente
- Ve a SQL Editor y ejecuta el schema de nuevo

**No se guardan las búsquedas**
- Verifica que las credenciales estén en `.env.local`
- Reinicia el servidor
- Revisa la consola del navegador (F12) por errores

---

## 📊 Próximos Pasos

Una vez configurado Supabase:
- ✅ Las búsquedas se guardarán automáticamente
- ✅ Podrás implementar el sistema de favoritos
- ✅ Tendrás historial de búsquedas
- ✅ Las campañas generadas se persistirán

---

**¿Listo?** Avísame cuando hayas completado estos pasos y verificaremos que todo funcione.
