# 📁 Estructura del Proyecto Oportunia

```
04-mvp-saas/
├── .github/                    # GitHub Actions y workflows
│   └── workflows/
│       └── supabase-migrations.yml
│
├── docs/                       # 📚 Documentación del proyecto
│   ├── setup/                  # Guías de configuración
│   │   ├── 01-clerk.md
│   │   ├── 02-supabase.md
│   │   ├── 03-mercadolibre.md
│   │   └── 04-deployment.md
│   ├── development/            # Guías de desarrollo
│   │   ├── commands.md
│   │   ├── migrations.md
│   │   └── testing.md
│   └── architecture/           # Documentación técnica
│       ├── overview.md
│       ├── database-schema.md
│       └── api-integration.md
│
├── src/                        # 💻 Código fuente
│   ├── actions/               # Server Actions
│   ├── app/                   # Next.js App Router
│   ├── components/            # Componentes React
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilidades y clientes
│   └── types/                 # TypeScript types
│
├── supabase/                   # 🗄️ Configuración de Supabase
│   ├── migrations/            # Migraciones SQL versionadas
│   ├── seed.sql              # Datos de prueba
│   └── config.toml           # Configuración local
│
├── public/                     # Archivos estáticos
│
├── .env.example               # Template de variables de entorno
├── .env.local                 # Variables locales (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md                  # Documentación principal
```

## 📋 Convenciones

### Documentación (`docs/`)
- **setup/**: Guías paso a paso para configurar servicios
- **development/**: Comandos y workflows de desarrollo
- **architecture/**: Decisiones técnicas y diagramas

### Código (`src/`)
- **actions/**: Server Actions de Next.js (prefijo `Action`)
- **components/**: Componentes React organizados por feature
- **lib/**: Lógica de negocio, clientes API, utilidades
- **types/**: Definiciones de TypeScript

### Base de Datos (`supabase/`)
- **migrations/**: Archivos SQL con timestamp (YYYYMMDDHHMMSS_nombre.sql)
- **seed.sql**: Datos iniciales para desarrollo

## 🔄 Migraciones Aplicadas

Esta estructura permite:
- ✅ Separación clara entre docs, config y código
- ✅ Fácil navegación para nuevos desarrolladores
- ✅ Escalabilidad a medida que crece el proyecto
- ✅ CI/CD automatizado con GitHub Actions
- ✅ Control de versiones de la base de datos
