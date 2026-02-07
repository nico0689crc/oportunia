'use server';

import { isAdmin } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/encryption';

interface MLConfig {
    clientId: string;
    clientSecret: string;
    siteId: string;
}

/**
 * Guarda una configuración global en la base de datos
 */
export async function saveAppSettingsAction(key: string, value: unknown) {
    if (!await isAdmin()) {
        throw new Error('No autorizado');
    }

    let valueToSave = value;

    // Lógica especial para ml_config (encriptación de secret)
    if (key === 'ml_config') {
        const newConfig = value as MLConfig;

        // Si el cliente envía el placeholder, intentamos mantener el secreto anterior
        if (newConfig.clientSecret === '••••••••••••••••') {
            const { data: existing } = await supabaseAdmin
                .from('app_settings')
                .select('value')
                .eq('key', 'ml_config')
                .single();

            if (existing && (existing.value as MLConfig).clientSecret) {
                newConfig.clientSecret = (existing.value as MLConfig).clientSecret;
            }
        } else if (newConfig.clientSecret) {
            // Es un secreto nuevo, lo encriptamos
            newConfig.clientSecret = encrypt(newConfig.clientSecret);
        }
        valueToSave = newConfig;
    }

    try {
        const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({ key, value: valueToSave, updated_at: new Date().toISOString() }, { onConflict: 'key' });

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
