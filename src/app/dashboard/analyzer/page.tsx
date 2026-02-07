import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch } from "lucide-react";

export default function AnalyzerPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analizador de Producto</h1>
                    <p className="text-muted-foreground">Pega el link o ID de un producto de Mercado Libre para analizar su performance.</p>
                </div>

                <Card className="border-2 border-dashed">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <PackageSearch className="h-5 w-5 text-primary" />
                            <CardTitle>Próximamente</CardTitle>
                        </div>
                        <CardDescription>Estamos portando la lógica de análisis inteligente del POC.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Aquí podrás ver scores de título, descripción, reviews y recomendaciones de IA.
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
