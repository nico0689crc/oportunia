import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

console.log('Initializing Supabase Admin Client:', {
    url: supabaseUrl,
    hasKey: !!supabaseServiceKey,
    keyStart: supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : 'MISSING'
});

// Cliente con service_role para operaciones seguras desde el servidor (Server Actions / API Routes)
// PRECAUCIÓN: Nunca usar este cliente en componentes del lado del cliente.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
