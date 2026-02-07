'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Globe, Save, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { saveAppSettingsAction, getAppSettingsAction } from "@/actions/admin";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminSettingsForm() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        clientId: "",
        clientSecret: "",
        siteId: "MLA"
    });
    const [authStatus, setAuthStatus] = useState<any>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const savedConfig = await getAppSettingsAction<any>('ml_config');
        const savedAuth = await getAppSettingsAction<any>('ml_auth_tokens');

        if (savedConfig) setConfig(savedConfig);
        if (savedAuth) setAuthStatus(savedAuth);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await saveAppSettingsAction('ml_config', config);
        if (result.success) {
            alert("Configuración guardada");
        } else {
            alert("Error al guardar: " + result.error);
        }
        setSaving(false);
    };

    const handleConnect = () => {
        // Enviar a ML para OAuth
        const clientId = config.clientId || process.env.NEXT_PUBLIC_ML_CLIENT_ID;
        const redirectUri = encodeURIComponent(window.location.origin + "/api/auth/ml/callback");
        const url = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
        window.location.href = url;
    };

    if (loading) return <div>Cargando configuración...</div>;

    return (
        <Card className="border-2">
            <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    Mercado Libre API (OAuth)
                </CardTitle>
                <CardDescription>
                    Estas credenciales se usarán para todas las consultas de búsqueda y análisis del sistema.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="client_id">Client ID</Label>
                        <Input
                            id="client_id"
                            value={config.clientId}
                            onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                            placeholder="Copia el ID de tu app en ML"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client_secret">Client Secret</Label>
                        <Input
                            id="client_secret"
                            type="password"
                            value={config.clientSecret}
                            onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                            placeholder="••••••••••••••••"
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="site_id">Site ID (Default)</Label>
                        <Input
                            id="site_id"
                            value={config.siteId}
                            onChange={(e) => setConfig({ ...config, siteId: e.target.value })}
                            placeholder="MLA (Argentina), MLB (Brasil), etc."
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <Button className="font-bold" onClick={handleSave} disabled={saving}>
                        {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                    <Button
                        variant="outline"
                        className="text-primary border-primary hover:bg-primary/5"
                        onClick={handleConnect}
                        disabled={!config.clientId}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Conectar con Mercado Libre
                    </Button>
                </div>

                {authStatus ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <strong>Estado: Conectado.</strong> Token expira el: {new Date(authStatus.expires_at).toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            <strong>Estado: No conectado.</strong> Debes configurar y conectar tu app.
                        </p>
                    </div>
                )}

                {searchParams.get('success') === 'connected' && (
                    <div className="p-4 bg-green-100 border border-green-500 rounded-lg animate-pulse">
                        <p className="text-sm text-green-900 font-bold">¡Conexión exitosa! El sistema ya está vinculado a Mercado Libre.</p>
                    </div>
                )}
                {searchParams.get('error') && (
                    <div className="p-4 bg-red-100 border border-red-500 rounded-lg text-red-900">
                        <p className="text-sm font-bold flex items-center gap-2">
                            <XCircle className="h-4 w-4" /> Error en la autenticación: {searchParams.get('error')}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
