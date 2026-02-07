import axios, { type AxiosInstance } from 'axios';
import { MlItem, MlSearchResponse, MlCategory } from '@/types/mercadolibre';

const ML_API_BASE_URL = process.env.ML_API_BASE_URL || 'https://api.mercadolibre.com';

export class MlClient {
    private client: AxiosInstance;
    private siteId: string;

    constructor(accessToken?: string, siteId: string = 'MLA') {
        this.siteId = siteId;
        this.client = axios.create({
            baseURL: ML_API_BASE_URL,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Oportunia-SaaS/1.0',
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
            },
        });
    }

    /**
     * Buscar productos por categoría (Best Sellers / Highlights)
     */
    async getHighlightsByCategory(categoryId: string, options?: { limit?: number; offset?: number }): Promise<MlSearchResponse> {
        const url = `/highlights/${this.siteId}/category/${categoryId}`;
        const response = await this.client.get(url);
        const highlights = (response.data.content || []).slice(0, options?.limit || 20);

        const itemIds: string[] = highlights.map((h: { id: string }) => h.id);
        const results = await this.getItems(itemIds);

        return {
            results,
            paging: {
                total: highlights.length,
                limit: options?.limit || 50,
                offset: options?.offset || 0,
            },
            site_id: this.siteId,
            category_id: categoryId,
        };
    }

    /**
     * Obtener detalles de múltiples ítems
     */
    async getItems(itemIds: string[]): Promise<MlItem[]> {
        if (itemIds.length === 0) return [];

        const chunks: string[][] = [];
        for (let i = 0; i < itemIds.length; i += 20) {
            chunks.push(itemIds.slice(i, i + 20));
        }

        const responses = await Promise.all(
            chunks.map(chunk => this.client.get(`/items`, { params: { ids: chunk.join(',') } }))
        );

        return responses.flatMap(r => r.data.map((item: { body: MlItem }) => item.body));
    }

    /**
     * Obtener detalles de un item
     */
    async getItem(itemId: string): Promise<MlItem> {
        const response = await this.client.get(`/items/${itemId}`);
        return response.data;
    }

    /**
     * Obtener reviews de un item
     */
    async getItemReviews(itemId: string) {
        const response = await this.client.get(`/reviews/item/${itemId}`);
        return response.data;
    }

    /**
     * Obtener categorías de un sitio
     */
    async getCategories(): Promise<MlCategory[]> {
        const response = await this.client.get(`/sites/${this.siteId}/categories`);
        return response.data;
    }

    /**
     * Obtener detalle de una categoría
     */
    async getCategory(categoryId: string): Promise<MlCategory> {
        const response = await this.client.get(`/categories/${categoryId}`);
        return response.data;
    }
}

export const getMlClient = (accessToken?: string) => new MlClient(accessToken);
