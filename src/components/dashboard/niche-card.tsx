import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, ArrowRight } from "lucide-react";
import { NicheResult } from "@/lib/mercadolibre/niches-improved";

interface NicheCardProps {
    niche: NicheResult;
}

export function NicheCard({ niche }: NicheCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 70) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl capitalize">{niche.niche}</CardTitle>
                    <Badge variant="outline" className={`text-lg px-2 py-0.5 font-bold ${getScoreColor(niche.score)}`}>
                        {niche.score}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                        <TrendingUp className="h-4 w-4 text-blue-500 mb-1" />
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Demanda</span>
                        <span className="font-bold">{niche.demand}%</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                        <Users className="h-4 w-4 text-orange-500 mb-1" />
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Competencia</span>
                        <span className="font-bold">{niche.competition}%</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                        <DollarSign className="h-4 w-4 text-green-500 mb-1" />
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Precio Avg</span>
                        <span className="font-bold">${niche.avgPrice}</span>
                    </div>
                </div>
                <p className="text-sm text-balance text-muted-foreground italic">
                    "{niche.explanation}"
                </p>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-4">
                <Button className="w-full" variant="outline">
                    Ver Productos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
