'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Globe, Save, RefreshCw, CheckCircle2, BrainCircuit } from "lucide-react";
import { saveAppSettingsAction, getAppSettingsAction } from "@/actions/admin";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { encrypt } from "@/lib/encryption";

interface MLConfig {
    clientId: string;
    clientSecret: string;
    siteId: string;
}

interface MLAuthStatus {
    access_token: string;
    expires_at: string;
    refresh_token?: string;
    ml_user_id?: string;
}

export default function AdminSettingsForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<MLConfig>({
        clientId: "",
        clientSecret: "",
        siteId: "MLA"
    });
    const [authStatus, setAuthStatus] = useState<MLAuthStatus | null>(null);
    const searchParams = useSearchParams();

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const savedConfig = await getAppSettingsAction<MLConfig>('ml_config');
            const savedAuth = await getAppSettingsAction<MLAuthStatus>('ml_auth_tokens');

            if (savedConfig) {
                setConfig({
                    ...savedConfig,
                    clientSecret: savedConfig.clientSecret ? '••••••••••••••••' : ''
                });
            }
            if (savedAuth) setAuthStatus(savedAuth);
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async () => {
        setSaving(true);

        // Prepare config for saving (encrypt secret if changed)
        const configToSave = { ...config };
        if (configToSave.clientSecret && configToSave.clientSecret !== '••••••••••••••••') {
            configToSave.clientSecret = encrypt(configToSave.clientSecret);
        }

        const promise = saveAppSettingsAction('ml_config', configToSave);

        toast.promise(promise, {
            loading: 'Guardando configuración...',
            success: (result) => {
                if (result.success) return 'Configuración guardada correctamente';
                throw new Error(result.error);
            },
            error: (err) => `Error: ${err.message || 'No se pudo guardar'}`
        });

        try {
            await promise;
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleConnect = () => {
        const clientId = config.clientId;
        const redirectUri = encodeURIComponent(window.location.origin + "/api/auth/ml/callback");
        const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
        window.location.href = authUrl;
    };

    if (loading) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
        </div>
    );

    return (
        <Tabs defaultValue="mercadolibre" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="mercadolibre" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Mercado Libre
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" /> Configuración IA
                </TabsTrigger>
            </TabsList>

            <TabsContent value="mercadolibre" className="mt-6 space-y-6">
                <Card className="border-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Credenciales de Aplicación</CardTitle>
                        <CardDescription>
                            Configura los parámetros de OAuth para la integración oficial con la API de Mercado Libre.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="client_id" className="text-sm font-semibold">Client ID</Label>
                                <Input
                                    id="client_id"
                                    value={config.clientId}
                                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                                    placeholder="ID de tu aplicación"
                                    className="border-primary/20 focus-visible:ring-primary"
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="client_secret" className="text-sm font-semibold">Client Secret</Label>
                                <Input
                                    id="client_secret"
                                    type="password"
                                    value={config.clientSecret}
                                    onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                                    placeholder="••••••••••••••••"
                                    className="border-primary/20 focus-visible:ring-primary"
                                    autoComplete="new-password"
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="site_id" className="text-sm font-semibold">Site ID por Defecto</Label>
                                <Input
                                    id="site_id"
                                    value={config.siteId}
                                    onChange={(e) => setConfig({ ...config, siteId: e.target.value })}
                                    placeholder="MLA"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-4 border-t">
                            <Button className="font-bold px-8 shadow-md transition-all hover:scale-[1.02]" onClick={handleSave} disabled={saving}>
                                {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Cambios
                            </Button>
                            <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary/5 transition-all"
                                onClick={handleConnect}
                                disabled={!config.clientId}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar con ML
                            </Button>
                        </div>

                        {authStatus ? (
                            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-green-900">Estado: Conectado Correctamente</p>
                                    <p className="text-xs text-green-700">Token válido hasta: {new Date(authStatus.expires_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <Key className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Estado: Requiere Acción</p>
                                    <p className="text-xs text-amber-700">Debes sincronizar tu cuenta para habilitar las búsquedas.</p>
                                </div>
                            </div>
                        )}

                        {searchParams.get('success') === 'connected' && (
                            <div className="p-4 bg-green-600 text-white rounded-lg shadow-lg animate-in fade-in zoom-in duration-300">
                                <p className="text-sm font-bold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" /> ¡Conexión con Mercado Libre establecida con éxito!
                                </p>
                            </div>
                        )}
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
