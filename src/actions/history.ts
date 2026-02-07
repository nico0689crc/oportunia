'use server';

import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Obtener el historial de búsquedas de un usuario
 */
export async function getSearchHistoryAction() {
    const { userId } = await auth();

    if (!userId) return [];

    const { data, error } = await supabaseAdmin
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching search history:', error);
        return [];
    }

    return data;
}

/**
 * Limpiar el historial de un usuario
 */
export async function clearSearchHistoryAction() {
    const { userId } = await auth();

    if (!userId) throw new Error('No autorizado');

    const { error } = await supabaseAdmin
        .from('search_history')
        .delete()
        .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return { success: true };
}
