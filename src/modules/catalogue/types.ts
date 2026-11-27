export type MetalType = 'GOLD' | 'SILVER' | 'PLATINUM';
export type MakingType = 'PERCENTAGE' | 'PER_GRAM' | 'FIXED';

export type MediaType =
  | 'DESIGN_RENDER'
  | 'PIECE_PHOTO'
  | 'HALLMARK_MACRO'
  | 'CERTIFICATE'
  | 'GENERAL_DOCUMENT';

export interface MediaAssetItem {
  id: string;
  businessId: string;
  productId?: string | null;
  stockItemId?: string | null;
  mediaType: MediaType;
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  thumbnails?: {
    sm_150?: string;
    md_400?: string;
    lg_1080?: string;
  } | null;
  isPrimary: boolean;
  caption?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ProductVariantItem {
  id: string;
  productId: string;
  sku: string; // Tier 3 SKU
  variantName: string;
  referenceWeight?: number | null;
  masterBarcode?: string | null; // Non-serialized barcode
  attributes?: Record<string, string | number> | null;
  isSerialized: boolean;
  stockCount?: number;
  createdAt: string;
}

export interface ProductDesignItem {
  id: string; // Tier 1 UUID
  businessId: string;
  productCode: string; // Tier 2 Design Code (e.g. RNG-22K-001)
  name: string;
  category: string;
  subCategory?: string | null;
  metal: MetalType;
  defaultPurity: string;
  hsnCode: string;
  standardMaking?: number | null;
  makingType: MakingType;
  imageUrl?: string | null;
  attributes?: Record<string, string | number | boolean> | null;
  variants?: ProductVariantItem[];
  mediaAssets?: MediaAssetItem[];
  totalStockCount?: number;
  createdAt: string;
}

export interface CreateProductDesignInput {
  productCode: string;
  name: string;
  category: string;
  subCategory?: string;
  metal: MetalType;
  defaultPurity: string;
  hsnCode?: string;
  standardMaking?: number;
  makingType?: MakingType;
  attributes?: Record<string, string | number | boolean>;
}

export interface CreateProductVariantInput {
  productId: string;
  sku: string;
  variantName: string;
  referenceWeight?: number;
  masterBarcode?: string;
  attributes?: Record<string, string | number>;
  isSerialized?: boolean;
}
