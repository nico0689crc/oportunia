import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
    console.error('CRITICAL: Supabase environment variables are missing. NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceKey) {
    console.error('CRITICAL: Supabase environment variables are missing. SUPABASE_SECRET_KEY');
}

// Cliente con service_role para operaciones seguras desde el servidor (Server Actions / API Routes)
// PRECAUCIÓN: Nunca usar este cliente en componentes del lado del cliente.
// Exportamos el cliente, pero lanzamos un error claro si se intenta usar sin la clave
export const supabaseAdmin = (function () {
    if (!supabaseUrl || !supabaseServiceKey) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Proxy({} as any, {
            get: () => {
                throw new Error('Supabase Admin Client no pudo inicializarse. Falta SUPABASE_SECRET_KEY en las variables de entorno.');
            }
        });
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
})();
