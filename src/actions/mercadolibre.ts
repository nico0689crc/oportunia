import { getDynamicMlClient } from '@/lib/mercadolibre/dynamic-client';
import { NichesProcessorImproved, NicheResult } from '@/lib/mercadolibre/niches-improved';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Acción para buscar nichos en una categoría
 */
export async function searchNichesAction(categoryId: string, categoryName?: string): Promise<{
    success: boolean;
    data?: NicheResult[];
    error?: string;
}> {
    try {
        const { userId } = await auth();
        const client = await getDynamicMlClient();

        const response = await client.getHighlightsByCategory(categoryId);
        const results = NichesProcessorImproved.analyzeAndGroup(response.results);

        // Guardar en el historial si la búsqueda fue exitosa y tenemos usuario
        if (results.length > 0 && userId && categoryName) {
            await supabaseAdmin.from('search_history').insert({
                user_id: userId,
                category_id: categoryId,
                category_name: categoryName
            });
        }

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
        const client = await getDynamicMlClient();
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

/**
 * Acción para obtener detalles de una categoría específica
 */
export async function getCategoryAction(categoryId: string) {
    try {
        const client = await getDynamicMlClient();
        const category = await client.getCategory(categoryId);
        return {
            success: true,
            data: category,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
