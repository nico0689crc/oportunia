import { getAppSettingsAction, saveAppSettingsAction } from '@/actions/admin';
import { decrypt, encrypt } from '@/lib/encryption';
import { MlAuth } from '@/lib/mercadolibre/auth';

interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    ml_user_id: string;
}

interface MPConfig {
    clientId: string;
    clientSecret: string;
    publicKey: string;
}

/**
 * Gets a valid Mercado Libre Access Token for Admin operations (Search, etc.)
 */
export async function getValidMLToken(): Promise<string> {
    return getValidToken('ml_config', 'ml_auth_tokens');
}

/**
 * Gets a valid Mercado Pago Access Token for Billing operations (Subscriptions, etc.)
 */
export async function getValidMPToken(): Promise<string> {
    return getValidToken('mp_config', 'mp_auth_tokens');
}

/**
 * Gets the Public Key for Mercado Pago frontend bricks.
 */
export async function getMPPublicKey(): Promise<string> {
    const config = await getAppSettingsAction<MPConfig>('mp_config');
    if (!config?.publicKey) {
        throw new Error('MP_PUBLIC_KEY_MISSING: Please configure Mercado Pago Public Key in Admin Settings.');
    }
    return config.publicKey;
}

/**
 * Generic function to get and refresh tokens for either ML or MP.
 */
async function getValidToken(configKey: 'ml_config' | 'mp_config', tokenKey: 'ml_auth_tokens' | 'mp_auth_tokens'): Promise<string> {
    const tokens = await getAppSettingsAction<AuthTokens>(tokenKey);

    if (!tokens) {
        throw new Error(`Tokens not found for ${tokenKey}. Please connect in Admin Settings.`);
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
            console.error(`Failed to decrypt access token for ${tokenKey}:`, error);
            throw new Error('CORRUPTED_TOKENS: Failed to decrypt access token.');
        }
    }

    console.log(`Token for ${tokenKey} expired or near expiry. Refreshing...`);

    // Fetch config to get clientId and encrypted clientSecret
    const config = await getAppSettingsAction<{ clientId: string; clientSecret: string }>(configKey);
    if (!config || !config.clientId || !config.clientSecret) {
        throw new Error(`${configKey.toUpperCase()}_MISSING: Cannot refresh token without application credentials.`);
    }

    // Need to refresh
    let decryptedRefreshToken: string;
    let decryptedClientSecret: string;
    try {
        decryptedRefreshToken = decrypt(refresh_token);
        decryptedClientSecret = decrypt(config.clientSecret);
    } catch (err) {
        console.error('Decryption failed during token refresh:', err);
        throw new Error('CORRUPTED_TOKENS: Failed to decrypt credentials.');
    }

    try {
        const platform = configKey === 'ml_config' ? 'ml' : 'mp';
        const newTokens = await MlAuth.refreshToken(
            config.clientId,
            decryptedClientSecret,
            decryptedRefreshToken,
            platform
        );

        // Save new tokens (ENCRYPTED)
        const updatedTokens: AuthTokens = {
            access_token: encrypt(newTokens.access_token),
            refresh_token: encrypt(newTokens.refresh_token),
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            ml_user_id: newTokens.user_id.toString(),
        };

        await saveAppSettingsAction(tokenKey, updatedTokens);

        return newTokens.access_token;
    } catch (error) {
        console.error(`Failed to refresh tokens for ${tokenKey}:`, error);
        throw new Error(`REFRESH_FAILED: Could not refresh tokens for ${tokenKey}. Manual reconnection might be required.`);
    }
}
