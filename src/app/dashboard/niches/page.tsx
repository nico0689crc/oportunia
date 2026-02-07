"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { NicheCard } from "@/components/dashboard/niche-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Info, FolderTree } from "lucide-react";
import { searchNichesAction } from "@/actions/mercadolibre";
import { NicheResult } from "@/lib/mercadolibre/niches-improved";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CategorySelector } from "@/components/dashboard/category-selector";
import { MlCategory } from "@/types/mercadolibre";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function NichesPage() {
    const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string }>({ id: "MLA1051", name: "Electrónica" });
    const [loading, setLoading] = useState(false);
    const [niches, setNiches] = useState<NicheResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectorOpen, setSelectorOpen] = useState(false);

    const handleSearch = async () => {
        if (!selectedCategory.id) return;
        setLoading(true);
        setError(null);
        try {
            const result = await searchNichesAction(selectedCategory.id, selectedCategory.name);
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

                <div className="flex flex-col md:flex-row gap-4 p-6 bg-card border-2 border-primary/10 rounded-3xl shadow-xl shadow-primary/5">
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Categoría a Analizar</label>
                        <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full h-12 justify-between px-4 text-left font-medium border-2 hover:border-primary/50 transition-all rounded-xl">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FolderTree className="h-5 w-5 text-primary shrink-0" />
                                        <span className="truncate">{selectedCategory.name}</span>
                                        <Badge variant="secondary" className="text-[10px] font-mono shrink-0">{selectedCategory.id}</Badge>
                                    </div>
                                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none rounded-3xl">
                                <DialogHeader className="p-6 bg-primary text-primary-foreground">
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                        <FolderTree className="h-6 w-6" />
                                        Explorador de Categorías
                                    </DialogTitle>
                                    <DialogDescription className="text-primary-foreground/80">
                                        Navega por el árbol oficial de Mercado Libre para encontrar el nicho perfecto.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="p-4 bg-muted/20">
                                    <CategorySelector
                                        onSelect={(cat) => {
                                            setSelectedCategory({ id: cat.id, name: cat.name });
                                            setSelectorOpen(false);
                                        }}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex items-end">
                        <Button
                            className="h-12 px-10 font-bold text-lg rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 w-full md:w-auto"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Analizar Oportunidades"}
                        </Button>
                    </div>
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
