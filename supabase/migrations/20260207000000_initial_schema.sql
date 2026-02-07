-- ============================================
-- OPORTUNIA - SUPABASE SCHEMA
-- ============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: searches
-- Almacena el historial de búsquedas de nichos
-- ============================================
CREATE TABLE IF NOT EXISTS searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

-- ============================================
-- TABLA: favorite_niches
-- Almacena los nichos que el usuario guardó como favoritos
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  niche_name TEXT NOT NULL,
  score INT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, niche_name)
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorite_niches(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_score ON favorite_niches(score DESC);

-- ============================================
-- TABLA: ml_tokens (para futuro OAuth)
-- Almacena tokens de Mercado Libre por usuario
-- ============================================
CREATE TABLE IF NOT EXISTS ml_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  ml_user_id BIGINT,
  scopes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_ml_tokens_user_id ON ml_tokens(user_id);

-- ============================================
-- TABLA: generated_campaigns (para futuro)
-- Almacena campañas generadas con IA
-- ============================================
CREATE TABLE IF NOT EXISTS generated_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  niche_name TEXT,
  titles TEXT[],
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON generated_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON generated_campaigns(created_at DESC);

-- ============================================
-- RLS (Row Level Security) - IMPORTANTE
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_campaigns ENABLE ROW LEVEL SECURITY;

-- Políticas para searches
CREATE POLICY "Users can view their own searches"
  ON searches FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own searches"
  ON searches FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Políticas para favorite_niches
CREATE POLICY "Users can view their own favorites"
  ON favorite_niches FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorite_niches FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorite_niches FOR DELETE
  USING (auth.uid()::text = user_id);

-- Políticas para ml_tokens
CREATE POLICY "Users can view their own tokens"
  ON ml_tokens FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON ml_tokens FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tokens"
  ON ml_tokens FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Políticas para generated_campaigns
CREATE POLICY "Users can view their own campaigns"
  ON generated_campaigns FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own campaigns"
  ON generated_campaigns FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- COMENTARIOS (Documentación)
-- ============================================

COMMENT ON TABLE searches IS 'Historial de búsquedas de nichos realizadas por usuarios';
COMMENT ON TABLE favorite_niches IS 'Nichos guardados como favoritos por los usuarios';
COMMENT ON TABLE ml_tokens IS 'Tokens OAuth de Mercado Libre vinculados a usuarios';
COMMENT ON TABLE generated_campaigns IS 'Campañas de publicación generadas con IA';

COMMENT ON COLUMN searches.results IS 'Array JSON con los resultados de nichos encontrados';
COMMENT ON COLUMN favorite_niches.metadata IS 'Metadatos del nicho (scores, precios, etc.)';
COMMENT ON COLUMN ml_tokens.scopes IS 'Scopes autorizados del token de ML';
COMMENT ON COLUMN generated_campaigns.titles IS 'Array de títulos optimizados generados';
