'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    const [mpMode, setMpMode] = useState<'production' | 'test'>('production');
    const [mpTestConfig, setMpTestConfig] = useState({
        accessToken: "",
        publicKey: ""
    });
    const [planIds, setPlanIds] = useState({
        proId: "",
        eliteId: "",
        proDevId: "",
        eliteDevId: ""
    });
    const [mlAuthStatus, setMlAuthStatus] = useState<AuthStatus | null>(null);
    const [mpAuthStatus, setMpAuthStatus] = useState<AuthStatus | null>(null);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const [savedMlConfig, savedMpConfig, savedMlAuth, savedMpAuth, savedMpMode, savedMpTestConfig, savedPlanProId, savedPlanEliteId, savedPlanProDevId, savedPlanEliteDevId] = await Promise.all([
                getAppSettingsAction<MLConfig>('ml_config'),
                getAppSettingsAction<MPConfig>('mp_config'),
                getAppSettingsAction<AuthStatus>('ml_auth_tokens'),
                getAppSettingsAction<AuthStatus>('mp_auth_tokens'),
                getAppSettingsAction<'production' | 'test'>('mp_mode'),
                getAppSettingsAction<{ accessToken: string; publicKey: string }>('mp_test_config'),
                getAppSettingsAction<string>('mp_plan_pro_id'),
                getAppSettingsAction<string>('mp_plan_elite_id'),
                getAppSettingsAction<string>('mp_plan_pro_dev_id'),
                getAppSettingsAction<string>('mp_plan_elite_dev_id')
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
            if (savedMpMode) setMpMode(savedMpMode);
            if (savedMpTestConfig) {
                setMpTestConfig({
                    accessToken: savedMpTestConfig.accessToken ? '••••••••••••••••' : '',
                    publicKey: savedMpTestConfig.publicKey || ''
                });
            }
            if (savedPlanProId || savedPlanEliteId || savedPlanProDevId || savedPlanEliteDevId) {
                setPlanIds({
                    proId: savedPlanProId || '',
                    eliteId: savedPlanEliteId || '',
                    proDevId: savedPlanProDevId || '',
                    eliteDevId: savedPlanEliteDevId || ''
                });
            }
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

    const handleSaveMp = async () => {
        setSaving(true);
        try {
            // Save mode first
            await saveAppSettingsAction('mp_mode', mpMode);

            // Save plan IDs
            await Promise.all([
                saveAppSettingsAction('mp_plan_pro_id', planIds.proId),
                saveAppSettingsAction('mp_plan_elite_id', planIds.eliteId),
                saveAppSettingsAction('mp_plan_pro_dev_id', planIds.proDevId),
                saveAppSettingsAction('mp_plan_elite_dev_id', planIds.eliteDevId)
            ]);

            if (mpMode === 'test') {
                // Save test config (server will handle encryption)
                await saveAppSettingsAction('mp_test_config', {
                    accessToken: mpTestConfig.accessToken,
                    publicKey: mpTestConfig.publicKey
                });
                toast.success('Configuración de Test guardada correctamente');
            } else {
                // Save production config (existing flow)
                await handleSave('mp_config', mpConfig);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al guardar';
            toast.error(message);
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
                        {/* Mode Toggle */}
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Modo de Operación</Label>
                                <p className="text-sm text-muted-foreground">
                                    {mpMode === 'production' ? 'Producción (OAuth con refresh tokens)' : 'Pruebas (Sandbox con token estático)'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${mpMode === 'production' ? 'text-muted-foreground' : 'text-primary'}`}>
                                    Test
                                </span>
                                <Switch
                                    checked={mpMode === 'production'}
                                    onCheckedChange={(checked) => setMpMode(checked ? 'production' : 'test')}
                                />
                                <span className={`text-sm font-medium ${mpMode === 'production' ? 'text-primary' : 'text-muted-foreground'}`}>
                                    Producción
                                </span>
                            </div>
                        </div>

                        {/* Production Mode Fields */}
                        {mpMode === 'production' && (
                            <>
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

                                </div>
                            </>
                        )}

                        {/* Test Mode Fields */}
                        {mpMode === 'test' && (
                            <>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mp_test_access_token" className="text-sm font-semibold">Access Token de Test</Label>
                                        <Input
                                            id="mp_test_access_token"
                                            type="password"
                                            value={mpTestConfig.accessToken}
                                            onChange={(e) => setMpTestConfig({ ...mpTestConfig, accessToken: e.target.value })}
                                            placeholder="TEST-..."
                                            className="border-primary/20 focus-visible:ring-primary font-mono text-xs"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Obtén este token desde: <strong>Mercado Pago Dashboard → Tus integraciones → Credenciales de prueba → Access Token</strong>
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mp_test_public_key" className="text-sm font-semibold">Public Key de Test</Label>
                                        <Input
                                            id="mp_test_public_key"
                                            value={mpTestConfig.publicKey}
                                            onChange={(e) => setMpTestConfig({ ...mpTestConfig, publicKey: e.target.value })}
                                            placeholder="TEST-..."
                                            className="border-primary/20 focus-visible:ring-primary font-mono text-xs"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Obtén esta clave desde: <strong>Mercado Pago Dashboard → Tus integraciones → Credenciales de prueba → Public Key</strong>
                                        </p>
                                    </div>
                                </div>

                                {/* Plan IDs Configuration */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3">IDs de Planes de Suscripción</h4>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            Configura los IDs de los planes PRO y ELITE creados en Mercado Pago
                                        </p>
                                    </div>

                                    {/* Production Plan IDs */}
                                    <div>
                                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">Producción</h5>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="mp_plan_pro_id" className="text-sm font-semibold">Plan PRO ID</Label>
                                                <Input
                                                    id="mp_plan_pro_id"
                                                    value={planIds.proId}
                                                    onChange={(e) => setPlanIds({ ...planIds, proId: e.target.value })}
                                                    placeholder="9ca6b291fdea4956ac9712162f26f160"
                                                    className="border-primary/20 focus-visible:ring-primary font-mono text-xs"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    ID del plan PRO en Mercado Pago Dashboard
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mp_plan_elite_id" className="text-sm font-semibold">Plan ELITE ID</Label>
                                                <Input
                                                    id="mp_plan_elite_id"
                                                    value={planIds.eliteId}
                                                    onChange={(e) => setPlanIds({ ...planIds, eliteId: e.target.value })}
                                                    placeholder="6fe66c35cddc46f6b7d37caab8c32bad"
                                                    className="border-primary/20 focus-visible:ring-primary font-mono text-xs"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    ID del plan ELITE en Mercado Pago Dashboard
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Development Plan IDs */}
                                    <div className="pt-4 border-t">
                                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">Desarrollo (ngrok/localhost)</h5>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="mp_plan_pro_dev_id" className="text-sm font-semibold">Plan PRO DEV ID</Label>
                                                <Input
                                                    id="mp_plan_pro_dev_id"
                                                    value={planIds.proDevId}
                                                    onChange={(e) => setPlanIds({ ...planIds, proDevId: e.target.value })}
                                                    placeholder="f913df8a1fe74fbead1160633948faf5"
                                                    className="border-primary/20 focus-visible:ring-primary font-mono text-xs"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    ID del plan PRO para desarrollo local
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mp_plan_elite_dev_id" className="text-sm font-semibold">Plan ELITE DEV ID</Label>
                                                <Input
                                                    id="mp_plan_elite_dev_id"
                                                    value={planIds.eliteDevId}
                                                    onChange={(e) => setPlanIds({ ...planIds, eliteDevId: e.target.value })}
                                                    placeholder="2778bf5abb354abe9cbc822bdbccfd73"
                                                    className="border-primary/20 focus-visible:ring-primary font-mono text-xs"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    ID del plan ELITE para desarrollo local
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Test Mode Warning */}
                        {mpMode === 'test' && (
                            <>

                                <div className="space-y-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-amber-900">
                                                Modo Test: Requiere Usuarios de Prueba
                                            </p>
                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                En modo sandbox, <strong>NO puedes usar tu cuenta real de Mercado Pago</strong>.
                                                Debes usar usuarios de prueba y tarjetas de prueba para realizar pagos.
                                            </p>
                                            <div className="text-xs text-amber-800 space-y-1 mt-2">
                                                <p className="font-semibold">Para probar suscripciones:</p>
                                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                                    <li>Crea usuarios de prueba en el Dashboard de Mercado Pago</li>
                                                    <li>Usa esos usuarios para iniciar sesión en el checkout</li>
                                                    <li>Paga con tarjetas de prueba (ej: 5031 7557 3453 0604)</li>
                                                </ol>
                                            </div>
                                            <p className="text-xs text-amber-700 mt-2">
                                                📖 <a
                                                    href="https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-accounts"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline hover:text-amber-900 font-medium"
                                                >
                                                    Ver guía oficial de usuarios de prueba
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="pt-4 flex flex-wrap gap-4 border-t">
                            <Button className="font-bold px-8 shadow-md" onClick={handleSaveMp} disabled={saving}>
                                {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Mercado Pago
                            </Button>
                            {mpMode === 'production' && (
                                <Button
                                    variant="outline"
                                    className="border-primary text-primary"
                                    onClick={() => handleConnect('mp')}
                                    disabled={!mpConfig.clientId}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Admin MP
                                </Button>
                            )}
                        </div>

                        {mpAuthStatus && mpMode === 'production' ? (
                            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="text-sm font-bold text-green-900">MP Conectado</p>
                                    <p className="text-xs text-green-700">Token válido hasta: {new Date(mpAuthStatus.expires_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ) : mpMode === 'production' ? (
                            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <Key className="h-6 w-6 text-amber-600" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Requiere Sincronización MP</p>
                                    <p className="text-xs text-amber-700">Debes conectar tu cuenta para habilitar el procesamiento de pagos dinámico.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Modo Test Activo</p>
                                    <p className="text-xs text-blue-700">Usando credenciales de sandbox. Recuerda usar usuarios de prueba.</p>
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
