import { MlItem } from '@/types/mercadolibre';

export interface NicheGroup {
    name: string;
    items: MlItem[];
    totalItems: number;
    uniqueSellers: number;
    avgPrice: number;
    totalSold: number;
}

export interface NicheResult {
    niche: string;
    score: number;
    demand: number;
    competition: number;
    avgPrice: number;
    explanation: string;
}

const SCORE_WEIGHTS = {
    demand: 0.4,
    competition: 0.4,
    profitability: 0.2,
};

export class NichesProcessor {
    /**
     * Agrupar productos por palabras clave y calcular scores
     */
    static analyzeAndGroup(items: MlItem[]): NicheResult[] {
        const groups = this.groupItems(items);
        return groups.map(group => this.calculateScore(group)).sort((a, b) => b.score - a.score);
    }

    private static groupItems(items: MlItem[]): NicheGroup[] {
        const map = new Map<string, MlItem[]>();

        for (const item of items) {
            const nicheName = this.extractNicheName(item.title);
            if (!nicheName) continue;

            if (!map.has(nicheName)) map.set(nicheName, []);
            map.get(nicheName)!.push(item);
        }

        return Array.from(map.entries()).map(([name, groupItems]) => {
            const totalItems = groupItems.length;
            const uniqueSellers = new Set(groupItems.map(i => i.seller_id)).size;
            const totalSold = groupItems.reduce((sum, i) => sum + (i.sold_quantity || 0), 0);
            const avgPrice = groupItems.reduce((sum, i) => sum + i.price, 0) / totalItems;

            return { name, items: groupItems, totalItems, uniqueSellers, avgPrice, totalSold };
        });
    }

    private static extractNicheName(title: string): string | null {
        const words = title
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúñ ]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
            .slice(0, 3);

        return words.length > 0 ? words.join(' ') : null;
    }

    private static calculateScore(niche: NicheGroup): NicheResult {
        const demandScore = Math.min(100, (niche.totalSold / (niche.totalItems || 1)) * 10);
        const competitionScore = Math.min(100, niche.uniqueSellers * 5);
        const profitabilityScore = Math.min(100, niche.avgPrice / 1000);

        const finalScore = Math.round(
            demandScore * SCORE_WEIGHTS.demand +
            (100 - competitionScore) * SCORE_WEIGHTS.competition +
            profitabilityScore * SCORE_WEIGHTS.profitability
        );

        return {
            niche: niche.name,
            score: finalScore,
            demand: Math.round(demandScore * 10) / 10,
            competition: Math.round(competitionScore * 10) / 10,
            avgPrice: Math.round(niche.avgPrice),
            explanation: this.generateExplanation(niche, demandScore, competitionScore),
        };
    }

    private static generateExplanation(niche: NicheGroup, demand: number, competition: number): string {
        const dText = demand > 70 ? 'Alta demanda' : demand > 40 ? 'Demanda moderada' : 'Baja demanda';
        const cText = competition < 30 ? 'baja competencia' : competition < 60 ? 'competencia moderada' : 'alta competencia';
        return `${dText} (${niche.totalSold} ventas), ${cText} (${niche.uniqueSellers} vendedores).`;
    }
}
