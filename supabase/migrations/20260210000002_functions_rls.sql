-- ============================================
-- OPORTUNIA - FUNCTIONS AND POLICIES
-- ============================================

-- 1. SHARED FUNCTIONS

-- Handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reset subscription usage
CREATE OR REPLACE FUNCTION public.reset_subscription_usage(sub_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.subscriptions
    SET usage_count = 0,
        usage_reset_at = NOW() + INTERVAL '1 month'
    WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql;

-- 2. TRIGGERS

-- Subscriptions updated_at
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ML Tokens updated_at
DROP TRIGGER IF EXISTS set_ml_tokens_updated_at ON public.ml_tokens;
CREATE TRIGGER set_ml_tokens_updated_at
    BEFORE UPDATE ON public.ml_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. RLS POLICIES

-- Searches
CREATE POLICY "Users can view their own search history"
    ON search_history FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert their own search history"
    ON search_history FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Favorites
CREATE POLICY "Users can view their own favorites"
    ON favorites FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert their own favorites"
    ON favorites FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete their own favorites"
    ON favorites FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- ML Tokens
CREATE POLICY "Users can view their own tokens"
    ON ml_tokens FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can manage their own tokens"
    ON ml_tokens USING (user_id = auth.jwt() ->> 'sub');

-- Subscriptions
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions USING (true) WITH CHECK (true);

-- Campaigns
CREATE POLICY "Users can view their own campaigns"
    ON generated_campaigns FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert their own campaigns"
    ON generated_campaigns FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');
