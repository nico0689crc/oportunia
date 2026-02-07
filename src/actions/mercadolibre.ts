'use server';

import { getMlClient } from '@/lib/mercadolibre/client';
import { NichesProcessor, NicheResult } from '@/lib/mercadolibre/niches';

/**
 * Acción para buscar nichos en una categoría
 */
export async function searchNichesAction(categoryId: string): Promise<{
    success: boolean;
    data?: NicheResult[];
    error?: string;
}> {
    try {
        // Por ahora usamos el cliente sin token para búsqueda pública por highlights
        // En el futuro, el token vendría de Supabase ligado al usuario de Clerk
        const client = getMlClient();

        const response = await client.getHighlightsByCategory(categoryId);
        const results = NichesProcessor.analyzeAndGroup(response.results);

        return {
            success: true,
            data: results,
        };
    } catch (error: any) {
        console.error('Error in searchNichesAction:', error);
        return {
            success: false,
            error: error.message || 'Error desconocido al buscar nichos',
        };
    }
}

/**
 * Acción para obtener categorías principales
 */
export async function getCategoriesAction() {
    try {
        const client = getMlClient();
        const categories = await client.getCategories();
        return {
            success: true,
            data: categories,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
