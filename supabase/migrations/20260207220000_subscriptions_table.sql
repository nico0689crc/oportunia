-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE, -- Clerk User ID
    tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'elite'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled'
    mp_customer_id TEXT, -- Mercado Pago Customer ID (opcional)
    mp_subscription_id TEXT, -- ID de suscripción en MP (si se usa Pre-approval)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.jwt() ->> 'sub' = user_id);

-- Only service role can insert/update (Edge Function)
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions
    USING (true)
    WITH CHECK (true);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
