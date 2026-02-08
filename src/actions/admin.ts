'use server';

import { isAdmin } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/encryption';
import { cookies } from 'next/headers';
import { MlAuth } from '@/lib/mercadolibre/auth';

/**
 * Guarda una configuración global en la base de datos
 */
export async function saveAppSettingsAction(key: string, value: unknown) {
    if (!await isAdmin()) {
        throw new Error('No autorizado');
    }

    let valueToSave = value;

    // Lógica especial para ml_config y mp_config (encriptación de secret)
    if (key === 'ml_config' || key === 'mp_config') {
        const newConfig = value as { clientSecret?: string };

        // Si el cliente envía el placeholder, intentamos mantener el secreto anterior
        if (newConfig.clientSecret === '••••••••••••••••') {
            const { data: existing } = await supabaseAdmin
                .from('app_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (existing && (existing.value as { clientSecret?: string }).clientSecret) {
                newConfig.clientSecret = (existing.value as { clientSecret?: string }).clientSecret;
            }
        } else if (newConfig.clientSecret) {
            // Es un secreto nuevo, lo encriptamos
            newConfig.clientSecret = encrypt(newConfig.clientSecret);
        }
        valueToSave = newConfig as Record<string, unknown>;
    }

    // Lógica especial para mp_test_config (encriptación de accessToken)
    if (key === 'mp_test_config') {
        const testConfig = value as { accessToken?: string; publicKey?: string };

        // Si el cliente envía el placeholder, mantener el token anterior
        if (testConfig.accessToken === '••••••••••••••••') {
            const { data: existing } = await supabaseAdmin
                .from('app_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (existing && (existing.value as { accessToken?: string }).accessToken) {
                testConfig.accessToken = (existing.value as { accessToken?: string }).accessToken;
            }
        } else if (testConfig.accessToken) {
            // Ya no encriptamos el token de prueba para evitar líos en sandbox
            // testConfig.accessToken = encrypt(testConfig.accessToken);
        }
        valueToSave = testConfig as Record<string, unknown>;
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
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is code for "no rows found"
            console.error(`Error fetching app setting ${key}:`, error);
        }
        return null;
    }

    if (!data) return null;
    return data.value as T;
}

/**
 * Genera la URL de autorización de Mercado Libre con PKCE
 * Soporta plataformas 'ml' (Mercado Libre) y 'mp' (Mercado Pago)
 */
export async function getMlAuthUrlAction(platform: 'ml' | 'mp' = 'ml') {
    if (!await isAdmin()) {
        throw new Error('No autorizado');
    }

    const configKey = platform === 'ml' ? 'ml_config' : 'mp_config';
    const config = await getAppSettingsAction<{ clientId: string }>(configKey);

    if (!config || !config.clientId) {
        throw new Error(`${platform.toUpperCase()}_CONFIG_MISSING: Por favor configura el Client ID para ${platform} primero.`);
    }

    const verifier = MlAuth.generateCodeVerifier();
    const challenge = MlAuth.generateCodeChallenge(verifier);
    const state = MlAuth.generateState();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/ml/callback`;

    // Guardar verifier, state y plataforma en cookies seguras
    const cookieStore = await cookies();

    cookieStore.set('ml_auth_platform', platform, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600
    });

    cookieStore.set('ml_code_verifier', verifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600 // 10 minutos
    });

    cookieStore.set('ml_auth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600
    });

    const mlConfig = await getAppSettingsAction<{ siteId?: string }>('ml_config');
    const siteId = mlConfig?.siteId || 'MLA';

    return MlAuth.getAuthorizationUrl(config.clientId, redirectUri, challenge, state, platform, siteId);
}

/**
 * Obtiene la Public Key de Mercado Pago para el frontend (Bricks)
 */
export async function getMPPublicKeyAction() {
    try {
        const { getMPPublicKey } = await import('@/lib/mercadopago/admin-auth');
        const publicKey = await getMPPublicKey();
        return { success: true, publicKey };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Error al obtener Public Key' };
    }
}
