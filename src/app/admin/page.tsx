import { AdminStats } from "@/components/admin/admin-stats";
import { AdminActivity } from "@/components/admin/admin-activity";
import { AdminCharts } from "@/components/admin/admin-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Download } from "lucide-react";

export default function AdminPage() {
    return (
        <div className="space-y-8">
            {/* Encabezado con acciones */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Consola de Control</h2>
                    <p className="text-muted-foreground">Bienvenido al centro de mando de Oportunia.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Exportar Logs
                    </Button>
                    <Button size="sm">
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Ver en Vivo
                    </Button>
                </div>
            </div>

            {/* Métricas Principales */}
            <AdminStats />

            <div className="grid gap-4 md:grid-cols-7">
                {/* Gráfico de Actividad */}
                <Card className="col-span-full md:col-span-4">
                    <CardHeader>
                        <CardTitle>Actividad Semanal</CardTitle>
                        <CardDescription>Volumen de búsquedas de nichos realizadas por los usuarios.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <AdminCharts />
                    </CardContent>
                </Card>

                {/* Resumen de Salud de API */}
                <Card className="col-span-full md:col-span-3">
                    <CardHeader>
                        <CardTitle>Estado del Ecosistema</CardTitle>
                        <CardDescription>Monitoreo de latencia y disponibilidad.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Mercado Libre API</span>
                                <span className="text-green-600 font-medium">99.9% Online</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[99.9%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Google Gemini 1.5</span>
                                <span className="text-green-600 font-medium">Latencia 820ms</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[85%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Supabase DB</span>
                                <span className="text-green-600 font-medium">Salud Óptima</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[100%]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actividad Reciente */}
            <div className="grid gap-4">
                <AdminActivity />
            </div>
        </div>
    );
}
