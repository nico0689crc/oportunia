# Oportunia - MVP SaaS para Vendedores de Mercado Libre

> Herramienta de descubrimiento de nichos y generación de campañas optimizadas con IA para vendedores de Mercado Libre.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)](https://clerk.com/)

---

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Iniciar desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📚 Documentación

- **Setup Inicial**: [`docs/setup/`](docs/setup/)
  - [Configurar Clerk](docs/setup/01-clerk.md)
  - [Configurar Supabase](docs/setup/02-supabase-professional.md)
  
- **Desarrollo**: [`docs/development/`](docs/development/)
  - [Comandos de Supabase](docs/development/supabase-commands.md)
  
- **Arquitectura**: [`docs/architecture/`](docs/architecture/)
  - [Roadmap de Implementación](docs/architecture/roadmap.md)
  - [Estructura del Proyecto](docs/PROJECT_STRUCTURE.md)

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **Autenticación** | Clerk |
| **Base de Datos** | Supabase (PostgreSQL) |
| **UI** | Shadcn/ui + Tailwind CSS |
| **API Externa** | Mercado Libre API |
| **IA** | OpenAI (próximamente) |
| **Billing** | Stripe (próximamente) |
| **Deploy** | Vercel |

---

## ✨ Funcionalidades

### ✅ Implementadas

- [x] Autenticación completa con Clerk
- [x] Buscador de Nichos con algoritmo de scoring mejorado
- [x] Dashboard con UI premium (Sidebar, Header)
- [x] Persistencia en Supabase con migraciones versionadas
- [x] Landing page profesional
- [x] CI/CD con GitHub Actions

### 🚧 En Desarrollo

- [ ] Generador de Campañas con IA (OpenAI)
- [ ] Sistema de Favoritos
- [ ] Analizador de Productos
- [ ] Billing con Stripe
- [ ] Selector visual de categorías

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar linter

# Base de Datos (Supabase)
npm run db:start     # Iniciar Supabase local (Docker)
npm run db:stop      # Detener Supabase local
npm run db:push      # Aplicar migraciones a remoto
npm run db:pull      # Traer schema desde remoto
npm run db:reset     # Resetear DB local
npm run db:status    # Ver estado de Supabase
```

---

## 🗂️ Estructura del Proyecto

```
04-mvp-saas/
├── docs/              # Documentación
├── src/               # Código fuente
│   ├── actions/      # Server Actions
│   ├── app/          # Pages (App Router)
│   ├── components/   # Componentes React
│   ├── lib/          # Utilidades y clientes
│   └── types/        # TypeScript types
├── supabase/         # Migraciones y config
└── .github/          # CI/CD workflows
```

Ver [estructura completa](docs/PROJECT_STRUCTURE.md).

---

## 🔧 Configuración

### Requisitos Previos

- Node.js 20+
- npm o yarn
- Cuenta en [Clerk](https://clerk.com)
- Cuenta en [Supabase](https://supabase.com)
- (Opcional) Docker para desarrollo local de Supabase

### Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```env
# Clerk (Autenticación)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (Base de Datos)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Mercado Libre API
ML_CLIENT_ID=123456789
ML_CLIENT_SECRET=abcd1234...
ML_SITE_ID=MLA
```

Ver guías detalladas en [`docs/setup/`](docs/setup/).

---

## 🧪 Testing

```bash
# Ejecutar tests (próximamente)
npm test

# Tests E2E (próximamente)
npm run test:e2e
```

---

## 🚢 Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Variables de Entorno en Vercel

Configura las mismas variables de `.env.local` en:
- Vercel Dashboard → Project Settings → Environment Variables

---

## 🤝 Contribuir

Este es un proyecto privado en desarrollo. Para contribuir:

1. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

---

## 📄 Licencia

Privado - Todos los derechos reservados

---

## 📞 Soporte

Para preguntas o problemas:
- Revisa la [documentación](docs/)
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

**Desarrollado con ❤️ para vendedores de Mercado Libre**
