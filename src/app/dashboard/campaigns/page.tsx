import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function CampaignsPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Campañas</h1>
                    <p className="text-muted-foreground">Gestiona y optimiza tus publicaciones de Mercado Libre.</p>
                </div>

                <Card className="border-2 border-dashed">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle>Próximamente</CardTitle>
                        </div>
                        <CardDescription>Integración con Supabase para guardar tus borradores y campañas generadas.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Tus campañas optimizadas con IA aparecerán aquí una vez finalizada la integración.
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
