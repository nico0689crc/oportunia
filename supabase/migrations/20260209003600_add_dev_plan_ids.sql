-- Add development plan IDs to app_settings
-- These are for local development with ngrok URLs

INSERT INTO app_settings (key, value)
VALUES 
  ('mp_plan_pro_dev_id', '"f913df8a1fe74fbead1160633948faf5"'::json),
  ('mp_plan_elite_dev_id', '"2778bf5abb354abe9cbc822bdbccfd73"'::json)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;
