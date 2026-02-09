-- Add fields for recurring subscriptions
-- This migration adds columns to track subscription lifecycle and billing

-- Add new columns
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS preapproval_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_id TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Create index for faster lookups by preapproval_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_preapproval_id 
ON public.subscriptions(preapproval_id);

-- Create index for subscription_status
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON public.subscriptions(subscription_status);

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.preapproval_id IS 'ID de la suscripción en Mercado Pago (Preapproval ID)';
COMMENT ON COLUMN public.subscriptions.subscription_status IS 'Estado de la suscripción: pending, authorized, paused, cancelled';
COMMENT ON COLUMN public.subscriptions.next_billing_date IS 'Próxima fecha de cobro automático';
COMMENT ON COLUMN public.subscriptions.last_payment_id IS 'ID del último pago procesado';
COMMENT ON COLUMN public.subscriptions.last_payment_date IS 'Fecha del último pago exitoso';
