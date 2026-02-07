import { FeatureGate } from "@/components/subscriptions/feature-gate";
import NichesClient from "./niches-client";
import DashboardLayout from "@/components/dashboard/dashboard-layout";

export default function NichesPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Buscador de Nichos</h1>
                    <p className="text-muted-foreground">Explora categorías de Mercado Libre para encontrar huecos de mercado rentables.</p>
                </div>

                <FeatureGate feature="niche_search">
                    <NichesClient />
                </FeatureGate>
            </div>
        </DashboardLayout>
    );
}
