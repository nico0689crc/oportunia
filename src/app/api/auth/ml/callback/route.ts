import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getAppSettingsAction } from '@/actions/admin';
import { encrypt, decrypt } from '@/lib/encryption';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const cookieStore = await cookies();
    const storedVerifier = cookieStore.get('ml_code_verifier')?.value;
    const storedState = cookieStore.get('ml_auth_state')?.value;
    const platform = (cookieStore.get('ml_auth_platform')?.value || 'ml') as 'ml' | 'mp';

    // Clean up cookies immediately
    cookieStore.delete('ml_code_verifier');
    cookieStore.delete('ml_auth_state');
    cookieStore.delete('ml_auth_platform');

    if (error) {
        return NextResponse.redirect(new URL(`/admin/settings?error=${error}`, request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/admin/settings?error=no_code', request.url));
    }

    // Validate state to prevent CSRF
    if (!state || state !== storedState) {
        console.error('ML Auth Callback: Invalid state or state mismatch');
        return NextResponse.redirect(new URL('/admin/settings?error=invalid_state', request.url));
    }

    try {
        // Fetch config from DB based on platform
        const configKey = platform === 'ml' ? 'ml_config' : 'mp_config';
        const tokenKey = platform === 'ml' ? 'ml_auth_tokens' : 'mp_auth_tokens';

        const config = await getAppSettingsAction<{ clientId: string; clientSecret: string }>(configKey);

        if (!config || !config.clientId || !config.clientSecret) {
            console.error(`${platform.toUpperCase()} Configuration missing in database`);
            return NextResponse.redirect(new URL('/admin/settings?error=missing_config', request.url));
        }

        const clientId = config.clientId;
        const clientSecret = decrypt(config.clientSecret);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const redirectUri = `${baseUrl}/api/auth/ml/callback`;

        console.log(`Exchanging code for ${platform} tokens with PKCE...`, { clientId, redirectUri, hasVerifier: !!storedVerifier });

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
        });

        // Add code_verifier if we have it
        if (storedVerifier) {
            params.append('code_verifier', storedVerifier);
        }

        const response = await axios.post('https://api.mercadolibre.com/oauth/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const tokens = response.data;
        console.log(`${platform.toUpperCase()} Tokens received successfully:`, {
            user_id: tokens.user_id,
            has_access: !!tokens.access_token,
        });

        const { error: saveError } = await supabaseAdmin
            .from('app_settings')
            .upsert({
                key: tokenKey,
                value: {
                    access_token: encrypt(tokens.access_token),
                    refresh_token: encrypt(tokens.refresh_token),
                    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                    ml_user_id: tokens.user_id.toString(),
                },
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' })
            .select();

        if (saveError) {
            console.error('CRITICAL: Error saving tokens to database:', saveError);
            return NextResponse.redirect(new URL(`/admin/settings?error=db_save_failed&msg=${encodeURIComponent(saveError.message)}`, request.url));
        }

        return NextResponse.redirect(new URL('/admin/settings?success=connected', request.url));
    } catch (err: unknown) {
        let message = 'Error desconocido';
        if (axios.isAxiosError(err)) {
            message = err.response?.data?.message || err.message;
            if (err.response?.data) {
                console.error('ML API Error Details:', err.response.data);
            }
        } else if (err instanceof Error) {
            message = err.message;
        }

        console.error('Error in ML Auth Callback:', message);
        return NextResponse.redirect(new URL(`/admin/settings?error=auth_failed&details=${encodeURIComponent(message)}`, request.url));
    }
}
