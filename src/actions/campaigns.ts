'use server';

import { geminiModel } from '@/lib/gemini/client';
import { auth } from '@clerk/nextjs/server';

interface CampaignGenerationResult {
    success: boolean;
    data?: {
        titles: string[];
        description: string;
    };
    error?: string;
}

/**
 * Genera una campaña optimizada para un nicho usando Google Gemini (Gratis)
 */
export async function generateCampaignAction(nicheName: string, categoryId?: string): Promise<CampaignGenerationResult> {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Usuario no autenticado' };
    }

    try {
        const prompt = `
            Eres un experto en Growth Hacking y SEO para Mercado Libre. 
            Tu tarea es generar contenido para una publicación exitosa en el nicho: "${nicheName}".
            ${categoryId ? `La categoría de Mercado Libre es: ${categoryId}.` : ''}

            Por favor genera:
            1. Tres (3) títulos optimizados para SEO de máximo 60 caracteres cada uno. Usa keywords de alto tráfico.
            2. Una descripción persuasiva siguiendo el modelo AIDA (Atención, Interés, Deseo, Acción). Focalizada en beneficios y conversión.

            Responde exclusivamente en formato JSON con la siguiente estructura:
            {
                "titles": ["titulo 1", "titulo 2", "titulo 3"],
                "description": "texto de la descripción..."
            }
        `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error('No se recibió contenido de Gemini');

        const parsedData = JSON.parse(text);

        return {
            success: true,
            data: parsedData
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido al generar la campaña con Gemini';
        console.error('Error generating campaign with Gemini:', error);
        return {
            success: false,
            error: message,
        };
    }
}
