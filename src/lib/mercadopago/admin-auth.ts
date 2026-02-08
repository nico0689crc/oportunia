import { getAppSettingsAction, saveAppSettingsAction } from '@/actions/admin';
import { decrypt, encrypt } from '@/lib/encryption';
import { MlAuth } from '@/lib/mercadolibre/auth';

interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    ml_user_id: string;
}

interface MLConfig {
    clientId: string;
    clientSecret: string;
    publicKey: string;
    siteId: string;
}

/**
 * Gets a valid Mercado Pago/Libre Access Token for Admin operations.
 * Automatically refreshes the token if expired or near expiry.
 */
export async function getValidAdminToken(): Promise<string> {
    const tokens = await getAppSettingsAction<AuthTokens>('ml_auth_tokens');

    if (!tokens) {
        throw new Error('Mercado Pago Admin tokens not found. Please connect in Admin Settings.');
    }

    const { access_token, refresh_token, expires_at } = tokens;

    // Check if token is expired or expires in less than 1 hour
    const expiresDate = new Date(expires_at);
    const now = new Date();
    const isExpired = expiresDate.getTime() - now.getTime() < 3600000; // 1 hour buffer

    if (!isExpired) {
        try {
            return decrypt(access_token);
        } catch (error) {
            console.error('Failed to decrypt access token:', error);
            // If decryption fails, try to refresh maybe? or throw
            throw new Error('CORRUPTED_TOKENS: Failed to decrypt access token.');
        }
    }

    console.log('Mercado Pago Admin token expired or near expiry. Refreshing...');

    // Fetch config to get clientId and encrypted clientSecret
    const config = await getAppSettingsAction<MLConfig>('ml_config');
    if (!config || !config.clientId || !config.clientSecret) {
        throw new Error('ML_CONFIG_MISSING: Cannot refresh token without application credentials.');
    }

    // Need to refresh
    let decryptedRefreshToken: string;
    let decryptedClientSecret: string;
    try {
        decryptedRefreshToken = decrypt(refresh_token);
        decryptedClientSecret = decrypt(config.clientSecret);
    } catch (_error) {
        throw new Error('CORRUPTED_TOKENS: Failed to decrypt credentials.');
    }

    try {
        const newTokens = await MlAuth.refreshToken(
            config.clientId,
            decryptedClientSecret,
            decryptedRefreshToken
        );

        // Save new tokens (ENCRYPTED)
        const updatedTokens: AuthTokens = {
            access_token: encrypt(newTokens.access_token),
            refresh_token: encrypt(newTokens.refresh_token),
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            ml_user_id: newTokens.user_id.toString(),
        };

        await saveAppSettingsAction('ml_auth_tokens', updatedTokens);

        return newTokens.access_token;
    } catch (error) {
        console.error('Failed to refresh Mercado Pago Admin token:', error);
        throw new Error('REFRESH_FAILED: Could not refresh Admin tokens. Manual reconnection might be required.');
    }
}
