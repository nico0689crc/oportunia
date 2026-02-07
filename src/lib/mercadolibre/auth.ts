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
    static getAuthorizationUrl(clientId: string, redirectUri: string, codeChallenge: string, state: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: state,
            scope: 'read offline_access items searches',
            prompt: 'consent',
        });

        return `${ML_AUTH_BASE_URL}/authorization?${params.toString()}`;
    }

    /**
     * Intercambia el código por un token
     */
    static async exchangeCodeForToken(clientId: string, clientSecret: string, redirectUri: string, code: string, codeVerifier: string): Promise<MlTokenResponse> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        });

        const response = await axios.post(`${ML_API_BASE_URL}/oauth/token`, params.toString(), {
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
    static async refreshToken(clientId: string, clientSecret: string, refreshToken: string): Promise<MlTokenResponse> {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        });

        const response = await axios.post(`${ML_API_BASE_URL}/oauth/token`, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        });

        return response.data;
    }
}
