-- Manual migration script for recurring subscriptions
-- Run this in Supabase SQL Editor

-- Add new columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS preapproval_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_id TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_preapproval_id 
ON public.subscriptions(preapproval_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON public.subscriptions(subscription_status);

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.preapproval_id IS 'ID de la suscripción en Mercado Pago (Preapproval ID)';
COMMENT ON COLUMN public.subscriptions.subscription_status IS 'Estado de la suscripción: pending, authorized, paused, cancelled';
COMMENT ON COLUMN public.subscriptions.next_billing_date IS 'Próxima fecha de cobro automático';
COMMENT ON COLUMN public.subscriptions.last_payment_id IS 'ID del último pago procesado';
COMMENT ON COLUMN public.subscriptions.last_payment_date IS 'Fecha del último pago exitoso';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
