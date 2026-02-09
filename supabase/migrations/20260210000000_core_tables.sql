-- ============================================
-- OPORTUNIA - CONSOLIDATED CORE SCHEMA
-- ============================================

-- 1. APP SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.app_settings IS 'Global system configurations';

-- 2. SEARCH HISTORY
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON search_history(created_at DESC);

-- 3. FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    niche_id TEXT NOT NULL,
    niche_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, niche_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_niche_id ON favorites(niche_id);

-- 4. MERCADO LIBRE TOKENS
CREATE TABLE IF NOT EXISTS public.ml_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    ml_user_id BIGINT,
    scopes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.ml_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ml_tokens_user_id ON ml_tokens(user_id);

-- 5. GENERATED CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.generated_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    niche_name TEXT,
    titles TEXT[],
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.generated_campaigns ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON generated_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON generated_campaigns(created_at DESC);
