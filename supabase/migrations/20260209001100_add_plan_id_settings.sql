-- Add Plan ID settings to app_settings table
-- This allows configuration of Mercado Pago plan IDs through the admin panel

INSERT INTO app_settings (key, value, description)
VALUES 
  ('mp_plan_pro_id', '9ca6b291fdea4956ac9712162f26f160', 'Mercado Pago Plan ID for PRO tier'),
  ('mp_plan_elite_id', '6fe66c35cddc46f6b7d37caab8c32bad', 'Mercado Pago Plan ID for ELITE tier')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;
