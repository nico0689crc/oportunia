'use server';

import { isAdmin } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Guarda una configuración global en la base de datos
 */
export async function saveAppSettingsAction(key: string, value: unknown) {
    if (!await isAdmin()) {
        throw new Error('No autorizado');
    }

    try {
        const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) {
            console.error(`Error saving setting ${key}:`, error);
            return { success: false, error: error.message };
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido al guardar la configuración';
        console.error(`Error saving setting ${key}:`, error);
        return {
            success: false,
            error: message,
        };
    }

    revalidatePath('/admin/settings');
    return { success: true };
}

/**
 * Obtiene una configuración global
 */
export async function getAppSettingsAction<T>(key: string): Promise<T | null> {
    const { data, error } = await supabaseAdmin
        .from('app_settings') // Revert to 'app_settings' as per original function's intent
        .select('value') // Revert to 'value' as per original function's intent
        .eq('key', key)
        .single();

    if (error || !data) return null;
    return data.value as T;
}
