'use server';

import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { NicheResult } from '@/lib/mercadolibre/niches-improved';

/**
 * Toggle un nicho como favorito
 */
export async function toggleFavoriteAction(nicheId: string, nicheData?: NicheResult) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('No autorizado');
    }

    // Verificar si ya existe
    const { data: existing } = await supabaseAdmin
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('niche_id', nicheId)
        .single();

    if (existing) {
        // Eliminar si existe
        const { error } = await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('id', existing.id);

        if (error) throw new Error(error.message);
    } else {
        // Crear si no existe
        if (!nicheData) throw new Error('Niche data is required to add favorite');

        const { error } = await supabaseAdmin
            .from('favorites')
            .insert({
                user_id: userId,
                niche_id: nicheId,
                niche_data: nicheData
            });

        if (error) throw new Error(error.message);
    }

    revalidatePath('/dashboard/favorites');
    revalidatePath('/dashboard/niches');
    return { success: true, isFavorite: !existing };
}

/**
 * Obtener todos los favoritos del usuario
 */
export async function getFavoritesAction() {
    const { userId } = await auth();

    if (!userId) return [];

    const { data, error } = await supabaseAdmin
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }

    return data;
}

/**
 * Verificar si un nicho específico es favorito
 */
export async function isFavoriteAction(nicheId: string) {
    const { userId } = await auth();
    if (!userId) return false;

    const { data } = await supabaseAdmin
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('niche_id', nicheId)
        .single();

    return !!data;
}
