"use client";

import { useState, useEffect } from "react";
import { getCategoriesAction, getCategoryAction } from "@/actions/mercadolibre";
import { MlCategory } from "@/types/mercadolibre";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Loader2, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CategorySelectorProps {
    onSelect: (category: MlCategory) => void;
    currentCategoryId?: string;
}

export function CategorySelector({ onSelect }: CategorySelectorProps) {
    const [categories, setCategories] = useState<MlCategory[]>([]);
    const [path, setPath] = useState<MlCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar categorías raíz
    useEffect(() => {
        loadRootCategories();
    }, []);

    const loadRootCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCategoriesAction();
            if (result.success && result.data) {
                setCategories(result.data);
                setPath([]);
            } else {
                setError(result.error || "Error al cargar categorías");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = async (category: MlCategory) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCategoryAction(category.id);
            if (result.success && result.data) {
                const fullCategory = result.data;

                if (fullCategory.children_categories && fullCategory.children_categories.length > 0) {
                    // Si tiene hijos, navegar hacia adentro
                    const mappedChildren = fullCategory.children_categories.map(c => ({
                        id: c.id,
                        name: c.name,
                        total_items_in_this_category: c.total_items_in_this_category
                    }));
                    setCategories(mappedChildren);
                    setPath(prev => [...prev, fullCategory]);
                } else {
                    // Si es categoría hoja, seleccionarla directamente
                    onSelect(fullCategory);
                }
            } else {
                setError(result.error || "Error al cargar subcategorías");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const navigateBack = async () => {
        if (path.length === 0) return;

        const newPath = [...path];
        newPath.pop(); // Quitar la actual

        if (newPath.length === 0) {
            await loadRootCategories();
        } else {
            const parent = newPath[newPath.length - 1];
            setLoading(true);
            try {
                const result = await getCategoryAction(parent.id);
                if (result.success && result.data) {
                    const mappedChildren = result.data.children_categories?.map(c => ({
                        id: c.id,
                        name: c.name,
                        total_items_in_this_category: c.total_items_in_this_category
                    })) || [];
                    setCategories(mappedChildren);
                    setPath(newPath);
                }
            } catch {
                setError("Error al volver atrás");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col border rounded-xl bg-card overflow-hidden h-[400px]">
            {/* Header / Breadcrumbs */}
            <div className="p-3 border-b bg-muted/30 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={loadRootCategories}
                >
                    Inicio
                </Button>
                {path.map((cat, idx) => (
                    <div key={cat.id} className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            onClick={() => {
                                // Navegar a este punto del path
                                const newPath = path.slice(0, idx + 1);
                                setPath(newPath);
                                handleCategoryClick(cat);
                            }}
                        >
                            {cat.name}
                        </Button>
                    </div>
                ))}
            </div>

            {/* List area */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Cargando categorías...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-destructive">
                            <p>{error}</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={loadRootCategories}> Reintentar </Button>
                        </div>
                    ) : (
                        categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => handleCategoryClick(cat)}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderOpen className="h-4 w-4 text-primary opacity-70" />
                                    <span className="font-medium text-sm">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {cat.total_items_in_this_category && (
                                        <Badge variant="secondary" className="text-[10px] opacity-60">
                                            {cat.total_items_in_this_category.toLocaleString()} items
                                        </Badge>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Footer / Current actions */}
            {path.length > 0 && (
                <div className="p-3 border-t bg-muted/10 flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={navigateBack}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Volver
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Seleccionado: </span>
                        <Badge className="font-bold">{path[path.length - 1].name}</Badge>
                        <Button size="sm" className="font-bold" onClick={() => onSelect(path[path.length - 1])}>
                            Confirmar Búsqueda
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
