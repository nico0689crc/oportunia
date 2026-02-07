'use server';

import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

// Usamos el cliente con service_role para operaciones de admin (bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Guarda una configuración global en la base de datos
 */
export async function saveAppSettingsAction(key: string, value: any) {
    if (!await isAdmin()) {
        throw new Error('No autorizado');
    }

    const { error } = await supabaseAdmin
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
        console.error(`Error saving setting ${key}:`, error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { success: true };
}

/**
 * Obtiene una configuración global
 */
export async function getAppSettingsAction<T>(key: string): Promise<T | null> {
    const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) return null;
    return data.value as T;
}
