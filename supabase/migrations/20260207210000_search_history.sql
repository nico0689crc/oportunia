-- Crear tabla de historial de búsquedas
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own search history"
    ON search_history FOR SELECT
    USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own search history"
    ON search_history FOR INSERT
    WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own search history"
    ON search_history FOR DELETE
    USING (user_id = auth.jwt() ->> 'sub');

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON search_history(created_at DESC);
