import { MlClient } from './client';
import { getAppSettingsAction } from '@/actions/admin';
import { getValidMLToken } from '@/lib/mercadopago/admin-auth';

interface MlConfig {
    siteId: string;
}

/**
 * Obtiene una instancia de MlClient configurada con los datos reales de la DB
 * Utiliza getValidMLToken para asegurar que el token sea válido y esté refrescado.
 */
export async function getDynamicMlClient(): Promise<MlClient> {
    const config = await getAppSettingsAction<MlConfig>('ml_config');
    const siteId = config?.siteId || 'MLA';

    try {
        const accessToken = await getValidMLToken();
        return new MlClient(accessToken, siteId);
    } catch (error) {
        console.error('Error getting valid ML token for dynamic client:', error);
        // Fallback to client without token if auth fails, although most actions will fail later
        return new MlClient(undefined, siteId);
    }
}
