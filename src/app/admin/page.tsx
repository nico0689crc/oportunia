import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ShieldCheck, Link as LinkIcon, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estado API Mercado Libre</CardTitle>
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-2xl font-bold">Desconectado</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Configura las credenciales para empezar</p>
                        <Button asChild variant="outline" size="sm" className="w-full mt-4">
                            <Link href="/admin/settings">Configurar Conexión</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground mt-1">Sincronizado con Clerk</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                            <AlertTriangle className="mr-2 h-3 w-3" /> Reportar Problema
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
