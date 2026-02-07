import { MlClient } from './client';
import { getAppSettingsAction } from '@/actions/admin';

export interface MlConfig {
    clientId: string;
    clientSecret: string;
    siteId: string;
}

export interface MlAuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    ml_user_id: string;
}

/**
 * Obtiene una instancia de MlClient configurada con los datos reales de la DB
 */
export async function getDynamicMlClient(): Promise<MlClient> {
    const config = await getAppSettingsAction<MlConfig>('ml_config');
    const auth = await getAppSettingsAction<MlAuthTokens>('ml_auth_tokens');

    const siteId = config?.siteId || 'MLA';
    const accessToken = auth?.access_token;

    return new MlClient(accessToken, siteId);
}
