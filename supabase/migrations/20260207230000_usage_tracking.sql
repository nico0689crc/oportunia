-- Add usage tracking columns to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS usage_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month');

-- Function to reset usage (can be called by a cron or when updating tier)
CREATE OR REPLACE FUNCTION public.reset_subscription_usage(sub_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.subscriptions
    SET usage_count = 0,
        usage_reset_at = NOW() + INTERVAL '1 month'
    WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql;
