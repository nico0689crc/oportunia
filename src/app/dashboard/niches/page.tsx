"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { NicheCard } from "@/components/dashboard/niche-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Info } from "lucide-react";
import { searchNichesAction } from "@/actions/mercadolibre";
import { NicheResult } from "@/lib/mercadolibre/niches-improved";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NichesPage() {
    const [categoryId, setCategoryId] = useState("MLA1051"); // Electrónica por defecto
    const [loading, setLoading] = useState(false);
    const [niches, setNiches] = useState<NicheResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!categoryId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await searchNichesAction(categoryId);
            if (result.success && result.data) {
                setNiches(result.data);
            } else {
                setError(result.error || "Ocurrió un error");
            }
        } catch (err: any) {
            setError("Error al conectar con la API.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Buscador de Nichos</h1>
                    <p className="text-muted-foreground">Explora categorías de Mercado Libre para encontrar huecos de mercado rentables.</p>
                </div>

                <div className="flex gap-2 p-4 bg-card border rounded-xl shadow-sm">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Ej: MLA1051 (Electrónica)"
                            className="pl-10 h-11"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>
                    <Button className="h-11 px-8" onClick={handleSearch} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Analizar Categoría"}
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!loading && niches.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl">
                        <Info className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Comienza buscando una categoría</p>
                        <p className="text-sm text-muted-foreground">Analizaremos los Best Sellers para detectar oportunidades.</p>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[300px] w-full bg-muted animate-pulse rounded-xl" />
                        ))
                    ) : (
                        niches.map((niche) => (
                            <NicheCard key={niche.niche} niche={niche} />
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
