import { MlItem } from '@/types/mercadolibre';

export interface NicheGroup {
    name: string;
    items: MlItem[];
    totalItems: number;
    uniqueSellers: number;
    avgPrice: number;
    totalSold: number;
    avgReviews: number;
    avgRating: number;
}

export interface NicheResult {
    niche: string;
    score: number;
    demand: number;
    competition: number;
    profitability: number;
    avgPrice: number;
    totalSold: number;
    uniqueSellers: number;
    explanation: string;
    badge?: 'top-10' | 'rising' | 'competitive' | null;
}

const SCORE_WEIGHTS = {
    demand: 0.4,
    competition: 0.4,
    profitability: 0.2,
};

// Stop words comunes en español para limpieza de títulos
const STOP_WORDS = new Set([
    'para', 'con', 'sin', 'nueva', 'nuevo', 'original', 'oficial',
    'mejor', 'gratis', 'envio', 'full', 'oferta', 'hot', 'sale'
]);

export class NichesProcessorImproved {
    /**
     * Agrupar productos por palabras clave y calcular scores normalizados
     */
    static analyzeAndGroup(items: MlItem[]): NicheResult[] {
        if (items.length === 0) return [];

        const groups = this.groupItems(items);
        if (groups.length === 0) return [];

        // Calcular scores con normalización percentil
        const results = groups.map(group => this.calculateScore(group, groups));

        // Agregar badges
        const sortedByScore = [...results].sort((a, b) => b.score - a.score);
        const top10Threshold = sortedByScore[Math.floor(sortedByScore.length * 0.1)]?.score || 80;

        return results.map(r => ({
            ...r,
            badge: r.score >= top10Threshold ? 'top-10' :
                r.demand > 70 && r.competition < 50 ? 'rising' :
                    r.competition > 70 ? 'competitive' : null
        })).sort((a, b) => b.score - a.score);
    }

    private static groupItems(items: MlItem[]): NicheGroup[] {
        const map = new Map<string, MlItem[]>();

        for (const item of items) {
            const nicheName = this.extractNicheName(item.title);
            if (!nicheName) continue;

            if (!map.has(nicheName)) map.set(nicheName, []);
            map.get(nicheName)!.push(item);
        }

        // Filtrar nichos con menos de 2 productos (poco representativos)
        return Array.from(map.entries())
            .filter(([_, items]) => items.length >= 2)
            .map(([name, groupItems]) => {
                const totalItems = groupItems.length;
                const uniqueSellers = new Set(groupItems.map(i => i.seller_id)).size;
                const totalSold = groupItems.reduce((sum, i) => sum + (i.sold_quantity || 0), 0);
                const avgPrice = groupItems.reduce((sum, i) => sum + i.price, 0) / totalItems;

                // Calcular métricas de reviews si están disponibles
                const itemsWithReviews = groupItems.filter(i => i.sold_quantity && i.sold_quantity > 0);
                const avgReviews = itemsWithReviews.length > 0
                    ? itemsWithReviews.reduce((sum, i) => sum + (i.sold_quantity || 0), 0) / itemsWithReviews.length
                    : 0;

                return {
                    name,
                    items: groupItems,
                    totalItems,
                    uniqueSellers,
                    avgPrice,
                    totalSold,
                    avgReviews,
                    avgRating: 0 // Placeholder, ML API no siempre incluye rating en búsqueda
                };
            });
    }

    private static extractNicheName(title: string): string | null {
        const words = title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^a-z0-9 ]/g, '') // Solo alfanumérico
            .split(/\s+/)
            .filter(w => w.length > 3 && !STOP_WORDS.has(w)) // Filtrar palabras cortas y stop words
            .slice(0, 4); // Tomar hasta 4 palabras significativas

        return words.length >= 2 ? words.slice(0, 3).join(' ') : null;
    }

    private static normalizeToPercentile(value: number, min: number, max: number): number {
        if (max === min) return 50; // Si todos tienen el mismo valor, asignar neutro
        const normalized = ((value - min) / (max - min)) * 100;
        return Math.min(100, Math.max(0, normalized));
    }

    private static calculateScore(niche: NicheGroup, allNiches: NicheGroup[]): NicheResult {
        // Extraer todos los valores para calcular percentiles
        const allSoldCounts = allNiches.map(n => n.totalSold);
        const allSellerCounts = allNiches.map(n => n.uniqueSellers);
        const allPrices = allNiches.map(n => n.avgPrice);

        const minSold = Math.min(...allSoldCounts);
        const maxSold = Math.max(...allSoldCounts);
        const minSellers = Math.min(...allSellerCounts);
        const maxSellers = Math.max(...allSellerCounts);
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);

        // Scores normalizados a 0-100 basados en percentiles
        let demandScore = this.normalizeToPercentile(niche.totalSold, minSold, maxSold);

        // Si no hay datos de ventas, usar cantidad de items como proxy
        if (maxSold === 0) {
            const allItemCounts = allNiches.map(n => n.totalItems);
            const minItems = Math.min(...allItemCounts);
            const maxItems = Math.max(...allItemCounts);
            demandScore = this.normalizeToPercentile(niche.totalItems, minItems, maxItems);
        }

        const competitionScore = this.normalizeToPercentile(niche.uniqueSellers, minSellers, maxSellers);
        const profitabilityScore = this.normalizeToPercentile(niche.avgPrice, minPrice, maxPrice);

        // Score final ponderado (menor competencia es mejor, por eso invertimos)
        const finalScore = Math.round(
            demandScore * SCORE_WEIGHTS.demand +
            (100 - competitionScore) * SCORE_WEIGHTS.competition +
            profitabilityScore * SCORE_WEIGHTS.profitability
        );

        return {
            niche: niche.name,
            score: finalScore,
            demand: Math.round(demandScore),
            competition: Math.round(competitionScore),
            profitability: Math.round(profitabilityScore),
            avgPrice: Math.round(niche.avgPrice),
            totalSold: niche.totalSold,
            uniqueSellers: niche.uniqueSellers,
            explanation: this.generateExplanation(niche, demandScore, competitionScore, profitabilityScore),
        };
    }

    private static generateExplanation(
        niche: NicheGroup,
        demand: number,
        competition: number,
        profitability: number
    ): string {
        const parts: string[] = [];

        // Demanda
        if (demand > 75) parts.push('🔥 Muy alta demanda');
        else if (demand > 50) parts.push('📈 Buena demanda');
        else if (demand > 25) parts.push('📊 Demanda moderada');
        else parts.push('📉 Baja demanda');

        parts.push(`(${niche.totalSold} ventas totales)`);

        // Competencia
        if (competition < 25) parts.push('✅ Muy baja competencia');
        else if (competition < 50) parts.push('⚖️ Competencia moderada');
        else if (competition < 75) parts.push('⚠️ Alta competencia');
        else parts.push('🚨 Muy saturado');

        parts.push(`(${niche.uniqueSellers} vendedores)`);

        // Rentabilidad
        if (profitability > 70) parts.push('💰 Precio alto');
        else if (profitability > 40) parts.push('💵 Rango medio');
        else parts.push('💸 Precio bajo');

        return parts.join(' · ');
    }
}
