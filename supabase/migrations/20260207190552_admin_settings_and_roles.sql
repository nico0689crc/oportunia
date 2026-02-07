-- ============================================
-- OPORTUNIA - ADMIN SETTINGS
-- ============================================

-- Tabla para configuraciones globales de la aplicación
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Por defecto, nadie tiene acceso vía API anon
-- Las Server Actions usarán la service_role key o validarán el rol de Clerk

-- Política opcional para lectura (si se necesitara en el cliente)
-- Por ahora lo dejamos bloqueado para máxima seguridad

-- Comentarios
COMMENT ON TABLE app_settings IS 'Configuraciones globales del sistema (ML credentials, feature flags, etc.)';
