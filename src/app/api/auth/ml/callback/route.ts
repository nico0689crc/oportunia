import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { saveAppSettingsAction, getAppSettingsAction } from '@/actions/admin';
import { encrypt, decrypt } from '@/lib/encryption';

interface MLConfig {
    clientId: string;
    clientSecret: string;
    siteId: string;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL(`/admin/settings?error=${error}`, request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/admin/settings?error=no_code', request.url));
    }

    try {
        // Fetch config from DB instead of .env
        const config = await getAppSettingsAction<MLConfig>('ml_config');

        if (!config || !config.clientId || !config.clientSecret) {
            console.error('ML Configuration missing in database');
            return NextResponse.redirect(new URL('/admin/settings?error=missing_config', request.url));
        }

        const clientId = config.clientId;
        const clientSecret = decrypt(config.clientSecret);
        const redirectUri = `${request.nextUrl.origin}/api/auth/ml/callback`;

        const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
        });

        const tokens = response.data;

        await saveAppSettingsAction('ml_auth_tokens', {
            access_token: encrypt(tokens.access_token),
            refresh_token: encrypt(tokens.refresh_token),
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            ml_user_id: tokens.user_id,
        });

        return NextResponse.redirect(new URL('/admin/settings?success=connected', request.url));
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('Error in ML Auth Callback:', message);
        return NextResponse.redirect(new URL(`/admin/settings?error=auth_failed`, request.url));
    }
}
