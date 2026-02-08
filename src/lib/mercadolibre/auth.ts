import crypto from 'crypto';
import axios from 'axios';
import { MlTokenResponse } from '@/types/mercadolibre';

const ML_AUTH_BASE_URL = 'https://auth.mercadolibre.com.ar';
const ML_API_BASE_URL = 'https://api.mercadolibre.com';

export class MlAuth {
    /**
     * Genera un code_verifier para PKCE
     */
    static generateCodeVerifier(): string {
        return crypto.randomBytes(32).toString('base64url');
    }

    /**
     * Genera un estado aleatorio para prevenir CSRF
     */
    static generateState(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Genera un code_challenge a partir del code_verifier
     */
    static generateCodeChallenge(verifier: string): string {
        return crypto
            .createHash('sha256')
            .update(verifier)
            .digest('base64url');
    }

    /**
     * Genera la URL de autorización
     */
    static getAuthorizationUrl(clientId: string, redirectUri: string, codeChallenge: string, state: string, platform: 'ml' | 'mp' = 'ml', siteId: string = 'MLA'): string {
        // Map siteId to domain TLD
        const tldMap: Record<string, string> = {
            'MLA': 'com.ar',
            'MLM': 'com.mx',
            'MLB': 'com.br',
            'MLC': 'cl',
            'MCO': 'com.co',
            'MLU': 'com.uy',
            'MLV': 'com.ve',
            'MPE': 'com.pe',
            'MEC': 'com.ec'
        };
        const tld = tldMap[siteId] || 'com';
        const baseDomain = platform === 'ml' ? 'mercadolibre' : 'mercadopago';
        const authBaseUrl = `https://auth.${baseDomain}.${tld}`;

        const scopes = platform === 'ml'
            ? 'read offline_access items searches'
            : 'read offline_access payments';

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: state,
            scope: scopes,
            prompt: 'consent',
            platform_id: platform
        });

        return `${authBaseUrl}/authorization?${params.toString()}`;
    }

    /**
     * Intercambia el código por un token
     */
    static async exchangeCodeForToken(clientId: string, clientSecret: string, redirectUri: string, code: string, codeVerifier: string, platform: 'ml' | 'mp' = 'ml'): Promise<MlTokenResponse> {
        const apiBaseUrl = platform === 'ml' ? 'https://api.mercadolibre.com' : 'https://api.mercadopago.com';
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        });

        const response = await axios.post(`${apiBaseUrl}/oauth/token`, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        });

        return response.data;
    }

    /**
     * Refresca el token
     */
    static async refreshToken(clientId: string, clientSecret: string, refreshToken: string, platform: 'ml' | 'mp' = 'ml'): Promise<MlTokenResponse> {
        const apiBaseUrl = platform === 'ml' ? 'https://api.mercadolibre.com' : 'https://api.mercadopago.com';
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        });

        const response = await axios.post(`${apiBaseUrl}/oauth/token`, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        });

        return response.data;
    }
}
