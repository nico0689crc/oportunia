import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getAppSettingsAction } from '@/actions/admin';
import { encrypt, decrypt } from '@/lib/encryption';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const redirectUri = `${baseUrl}/api/auth/ml/callback`;

        console.log('Exchanging ML code for tokens...', { clientId, redirectUri });

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
        });

        const response = await axios.post('https://api.mercadolibre.com/oauth/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const tokens = response.data;
        console.log('ML Tokens received successfully:', {
            user_id: tokens.user_id,
            has_access: !!tokens.access_token,
            has_refresh: !!tokens.refresh_token,
            expires_in: tokens.expires_in
        });

        console.log('Attempting DB upsert for ml_auth_tokens...');
        const { data: upsertData, error: saveError } = await supabaseAdmin
            .from('app_settings')
            .upsert({
                key: 'ml_auth_tokens',
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

        console.log('DB Upsert SUCCESS. Row count:', upsertData?.length);
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
