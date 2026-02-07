export interface MlSite {
  id: string;
  name: string;
}

export interface MlCategory {
  id: string;
  name: string;
  total_items_in_this_category?: number;
  path_from_root?: Array<{ id: string; name: string }>;
  children_categories?: Array<{ id: string; name: string; total_items_in_this_category: number }>;
}

export interface MlItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  sold_quantity?: number;
  condition: string;
  thumbnail: string;
  permalink: string;
  category_id: string;
  seller_id: number;
  catalog_product_id?: string;
  catalog_listing?: boolean;
  pictures?: Array<{ url: string }>;
  description?: string;
}

export interface MlSearchResponse {
  results: MlItem[];
  paging: {
    total: number;
    limit: number;
    offset: number;
  };
  site_id: string;
  category_id: string;
}

export interface MlTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  user_id: number;
}

// Re-exportar tipos del procesador mejorado para conveniencia
export type { NicheResult, NicheGroup } from '@/lib/mercadolibre/niches-improved';
