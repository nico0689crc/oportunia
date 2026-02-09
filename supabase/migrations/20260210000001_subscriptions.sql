-- ============================================
-- OPORTUNIA - CONSOLIDATED SUBSCRIPTIONS SCHEMA
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL, -- Clerk User ID
    tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'elite'
    status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'paused', 'cancelled', 'pending'
    subscription_status TEXT, -- MP Status (authorized, paused, cancelled)
    preapproval_id TEXT, -- MP Preapproval ID (Recurring)
    usage_count INTEGER NOT NULL DEFAULT 0,
    usage_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    next_billing_date TIMESTAMPTZ,
    last_payment_date TIMESTAMPTZ,
    last_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_preapproval_id ON public.subscriptions(preapproval_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Comments
COMMENT ON TABLE public.subscriptions IS 'Subscription and usage tracking for users';
COMMENT ON COLUMN public.subscriptions.preapproval_id IS 'ID de suscripción recurrente en Mercado Pago';
COMMENT ON COLUMN public.subscriptions.status IS 'Estado maestro en la aplicación';
COMMENT ON COLUMN public.subscriptions.subscription_status IS 'Estado crudo devuelto por la pasarela';
