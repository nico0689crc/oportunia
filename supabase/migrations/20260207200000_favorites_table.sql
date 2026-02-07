-- Crear tabla de favoritos
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    niche_id TEXT NOT NULL,
    niche_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, niche_id)
);

-- Habilitar RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Para uso con service_role o integración Clerk-Supabase)
-- Por ahora, como usamos supabaseAdmin en server actions, estas políticas
-- son informativas o preventivas.
CREATE POLICY "Users can view their own favorites"
    ON favorites FOR SELECT
    USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own favorites"
    ON favorites FOR INSERT
    WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own favorites"
    ON favorites FOR DELETE
    USING (user_id = auth.jwt() ->> 'sub');

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_niche_id ON favorites(niche_id);
