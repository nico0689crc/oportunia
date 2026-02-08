'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Globe, Save, RefreshCw, CheckCircle2, BrainCircuit } from "lucide-react";
import { saveAppSettingsAction, getAppSettingsAction, getMlAuthUrlAction } from "@/actions/admin";
import { toast } from "sonner";

interface MLConfig {
    clientId: string;
    clientSecret: string;
    siteId: string;
}

interface MPConfig {
    clientId: string;
    clientSecret: string;
    publicKey: string;
}

interface AuthStatus {
    access_token: string;
    expires_at: string;
    refresh_token?: string;
    ml_user_id?: string;
}

export default function AdminSettingsForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mlConfig, setMlConfig] = useState<MLConfig>({
        clientId: "",
        clientSecret: "",
        siteId: "MLA"
    });
    const [mpConfig, setMpConfig] = useState<MPConfig>({
        clientId: "",
        clientSecret: "",
        publicKey: ""
    });
    const [mlAuthStatus, setMlAuthStatus] = useState<AuthStatus | null>(null);
    const [mpAuthStatus, setMpAuthStatus] = useState<AuthStatus | null>(null);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const [savedMlConfig, savedMpConfig, savedMlAuth, savedMpAuth] = await Promise.all([
                getAppSettingsAction<MLConfig>('ml_config'),
                getAppSettingsAction<MPConfig>('mp_config'),
                getAppSettingsAction<AuthStatus>('ml_auth_tokens'),
                getAppSettingsAction<AuthStatus>('mp_auth_tokens')
            ]);

            if (savedMlConfig) {
                setMlConfig({
                    ...savedMlConfig,
                    clientSecret: savedMlConfig.clientSecret ? '••••••••••••••••' : ''
                });
            }
            if (savedMpConfig) {
                setMpConfig({
                    ...savedMpConfig,
                    clientSecret: savedMpConfig.clientSecret ? '••••••••••••••••' : ''
                });
            }
            if (savedMlAuth) setMlAuthStatus(savedMlAuth);
            if (savedMpAuth) setMpAuthStatus(savedMpAuth);
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async (key: 'ml_config' | 'mp_config', value: unknown) => {
        setSaving(true);
        const promise = saveAppSettingsAction(key, value);

        toast.promise(promise, {
            loading: 'Guardando configuración...',
            success: (result: { success: boolean; error?: string }) => {
                if (result.success) return 'Configuración guardada correctamente';
                throw new Error(result.error);
            },
            error: (err: Error) => `Error: ${err.message || 'No se pudo guardar'}`
        });

        try {
            await promise;
        } catch (error: unknown) {
            console.error("Save failed:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleConnect = async (platform: 'ml' | 'mp' = 'ml') => {
        try {
            const authUrl = await getMlAuthUrlAction(platform);
            window.location.href = authUrl;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al generar URL de conexión';
            toast.error(message);
        }
    };

    if (loading) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
        </div>
    );

    return (
        <Tabs defaultValue="mercadolibre" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
                <TabsTrigger value="mercadolibre" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Mercado Libre
                </TabsTrigger>
                <TabsTrigger value="mercadopago" className="flex items-center gap-2">
                    <Key className="h-4 w-4" /> Mercado Pago
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" /> Configuración IA
                </TabsTrigger>
            </TabsList>

            <TabsContent value="mercadolibre" className="mt-6 space-y-6">
                <Card className="border-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Mercado Libre: Búsquedas y API</CardTitle>
                        <CardDescription>
                            Credenciales para el motor de búsqueda de nichos y análisis de competencia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ml_client_id" className="text-sm font-semibold">Client ID</Label>
                                <Input
                                    id="ml_client_id"
                                    value={mlConfig.clientId}
                                    onChange={(e) => setMlConfig({ ...mlConfig, clientId: e.target.value })}
                                    placeholder="ID de tu aplicación ML"
                                    className="border-primary/20 focus-visible:ring-primary"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ml_client_secret" className="text-sm font-semibold">Client Secret</Label>
                                <Input
                                    id="ml_client_secret"
                                    type="password"
                                    value={mlConfig.clientSecret}
                                    onChange={(e) => setMlConfig({ ...mlConfig, clientSecret: e.target.value })}
                                    placeholder="••••••••••••••••"
                                    className="border-primary/20 focus-visible:ring-primary"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="site_id" className="text-sm font-semibold">Site ID por Defecto</Label>
                                <Input
                                    id="site_id"
                                    value={mlConfig.siteId}
                                    onChange={(e) => setMlConfig({ ...mlConfig, siteId: e.target.value })}
                                    placeholder="MLA"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-4 border-t">
                            <Button className="font-bold px-8 shadow-md" onClick={() => handleSave('ml_config', mlConfig)} disabled={saving}>
                                {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Mercado Libre
                            </Button>
                            <Button
                                variant="outline"
                                className="border-primary text-primary"
                                onClick={() => handleConnect('ml')}
                                disabled={!mlConfig.clientId}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Admin ML
                            </Button>
                        </div>

                        {mlAuthStatus ? (
                            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="text-sm font-bold text-green-900">ML Conectado</p>
                                    <p className="text-xs text-green-700">Token válido hasta: {new Date(mlAuthStatus.expires_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <Key className="h-6 w-6 text-amber-600" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Requiere Sincronización ML</p>
                                    <p className="text-xs text-amber-700">Debes conectar tu cuenta para habilitar las búsquedas.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="mercadopago" className="mt-6 space-y-6">
                <Card className="border-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Mercado Pago: Pagos y Suscripciones</CardTitle>
                        <CardDescription>
                            Credenciales para el sistema de facturación y cobro recurrente del SaaS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="mp_client_id" className="text-sm font-semibold">Client ID</Label>
                                <Input
                                    id="mp_client_id"
                                    value={mpConfig.clientId}
                                    onChange={(e) => setMpConfig({ ...mpConfig, clientId: e.target.value })}
                                    placeholder="ID de tu aplicación MP"
                                    className="border-primary/20 focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mp_client_secret" className="text-sm font-semibold">Client Secret</Label>
                                <Input
                                    id="mp_client_secret"
                                    type="password"
                                    value={mpConfig.clientSecret}
                                    onChange={(e) => setMpConfig({ ...mpConfig, clientSecret: e.target.value })}
                                    placeholder="••••••••••••••••"
                                    className="border-primary/20 focus-visible:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="mp_public_key" className="text-sm font-semibold">Public Key</Label>
                                <Input
                                    id="mp_public_key"
                                    value={mpConfig.publicKey}
                                    onChange={(e) => setMpConfig({ ...mpConfig, publicKey: e.target.value })}
                                    placeholder="APP_USR-..."
                                    className="border-primary/20 focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">URL de Webhook (MP Notification)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value="https://<tusubdominio>.supabase.co/functions/v1/mercadopago-webhook"
                                        className="bg-muted/50 font-mono text-xs border-dashed"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                    Configura esta URL en el panel de Mercado Pago Developers bajo &quot;Notificaciones Webhooks&quot;.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-4 border-t">
                            <Button className="font-bold px-8 shadow-md" onClick={() => handleSave('mp_config', mpConfig)} disabled={saving}>
                                {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Mercado Pago
                            </Button>
                            <Button
                                variant="outline"
                                className="border-primary text-primary"
                                onClick={() => handleConnect('mp')}
                                disabled={!mpConfig.clientId}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Admin MP
                            </Button>
                        </div>

                        {mpAuthStatus ? (
                            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="text-sm font-bold text-green-900">MP Conectado</p>
                                    <p className="text-xs text-green-700">Token válido hasta: {new Date(mpAuthStatus.expires_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <Key className="h-6 w-6 text-amber-600" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Requiere Sincronización MP</p>
                                    <p className="text-xs text-amber-700">Debes conectar tu cuenta para habilitar el procesamiento de pagos dinámico.</p>
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-800">
                                <strong>Nota:</strong> Para el Checkout API (Bricks), asegúrate de usar las credenciales de Producción o Prueba según el ambiente que desees testear.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
                <Card className="border-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Motor de Inteligencia Artificial</CardTitle>
                        <CardDescription>
                            Configura qué modelo de IA procesará la generación de campañas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
                            <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">Configuración de IA en camino</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                                Actualmente el sistema utiliza Google Gemini 1.5 Flash por defecto. Próximamente podrás cambiar a GPT-4 o modelos locales.
                            </p>
                            <Button variant="outline" className="mt-6" disabled>Próximamente</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
