"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, ArrowRight, Sparkles, Loader2, Copy, Check, Star } from "lucide-react";
import { NicheResult } from "@/lib/mercadolibre/niches-improved";
import { generateCampaignAction } from "@/actions/campaigns";
import { toggleFavoriteAction } from "@/actions/favorites";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NicheCardProps {
    niche: NicheResult;
    initialIsFavorite?: boolean;
}

export function NicheCard({ niche, initialIsFavorite = false }: NicheCardProps) {
    const [generating, setGenerating] = useState(false);
    const [campaign, setCampaign] = useState<{ titles: string[], description: string } | null>(null);
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [toggling, setToggling] = useState(false);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setToggling(true);
        try {
            const result = await toggleFavoriteAction(niche.niche, niche);
            if (result.success) {
                setIsFavorite(result.isFavorite!);
            }
        } catch {
            // Error silently ignored or logged to sentry in future
        } finally {
            setToggling(false);
        }
    };

    const handleGenerateCampaign = async () => {
        setGenerating(true);
        try {
            const result = await generateCampaignAction(niche.niche);
            if (result.success && result.data) {
                setCampaign(result.data);
                setOpen(true);
            } else {
                alert(result.error || "Error al generar la campaña");
            }
        } catch {
            alert("Ocurrió un error inesperado");
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors flex flex-col h-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl capitalize line-clamp-1 flex-1">{niche.niche}</CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-full transition-all ${isFavorite ? 'text-yellow-500 fill-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:text-yellow-500'}`}
                            onClick={handleToggleFavorite}
                            disabled={toggling}
                        >
                            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                        </Button>
                        <Badge variant="outline" className={`text-lg px-2 py-0.5 font-bold ${getScoreColor(niche.score)} flex-shrink-0`}>
                            {niche.score}
                        </Badge>
                    </div>
                </div>
                {niche.badge && (
                    <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-primary/10 text-primary border-primary/20">
                            {niche.badge === 'top-10' ? '⭐ Top 10%' : niche.badge === 'rising' ? '🚀 Tendencia' : '🔥 Competitivo'}
                        </Badge>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                        <TrendingUp className="h-4 w-4 text-blue-500 mb-1" />
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Ventas</span>
                        <span className="font-bold">{niche.totalSold}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                        <Users className="h-4 w-4 text-orange-500 mb-1" />
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Vendedores</span>
                        <span className="font-bold">{niche.uniqueSellers}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                        <DollarSign className="h-4 w-4 text-green-500 mb-1" />
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Precio Avg</span>
                        <span className="font-bold">${niche.avgPrice}</span>
                    </div>
                </div>
                <p className="text-sm text-balance text-muted-foreground italic">
                    &quot;{niche.explanation}&quot;
                </p>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-4 flex flex-col gap-2 mt-auto">
                <Dialog open={open} onOpenChange={setOpen}>
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 h-10"
                        onClick={handleGenerateCampaign}
                        disabled={generating}
                    >
                        {generating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generar Campaña IA
                    </Button>

                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <Sparkles className="h-6 w-6 text-primary" />
                                Campaña para {niche.niche}
                            </DialogTitle>
                            <DialogDescription>
                                Contenido optimizado con IA para tu publicación en Mercado Libre.
                            </DialogDescription>
                        </DialogHeader>

                        {campaign && (
                            <Tabs defaultValue="titles" className="mt-4">
                                <TabsList className="grid w-full grid-cols-2 h-11">
                                    <TabsTrigger value="titles" className="text-sm font-semibold">Títulos SEO</TabsTrigger>
                                    <TabsTrigger value="description" className="text-sm font-semibold">Descripción AIDA</TabsTrigger>
                                </TabsList>
                                <TabsContent value="titles" className="space-y-4 pt-4">
                                    {campaign.titles.map((title, i) => (
                                        <div key={i} className="group relative p-4 bg-muted rounded-xl border-2 border-transparent hover:border-primary/30 transition-all">
                                            <p className="font-medium pr-10">{title}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={() => copyToClipboard(title, `title-${i}`)}
                                            >
                                                {copied === `title-${i}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    ))}
                                </TabsContent>
                                <TabsContent value="description" className="pt-4">
                                    <div className="relative p-4 bg-muted rounded-xl border-2 border-transparent group">
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[300px] overflow-y-auto pr-8">
                                            {campaign.description}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-4 h-8 w-8"
                                            onClick={() => copyToClipboard(campaign.description, 'description')}
                                        >
                                            {copied === 'description' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </DialogContent>
                </Dialog>

                <Button className="w-full text-xs" variant="ghost" size="sm">
                    Ver Detalles <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
            </CardFooter>
        </Card>
    );
}
