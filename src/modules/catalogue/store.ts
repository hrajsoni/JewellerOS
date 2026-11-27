import {
  ProductDesignItem,
  ProductVariantItem,
  CreateProductDesignInput,
  CreateProductVariantInput,
} from './types';

const CATALOGUE_STORAGE_KEY = 'jewelbill_product_designs_v1';

// Seed sample designs for demo showroom
export const INITIAL_PRODUCT_DESIGNS: ProductDesignItem[] = [
  {
    id: 'des_rng_22k_001',
    businessId: 'default-tenant-sandhya',
    productCode: 'RNG-22K-001',
    name: 'Royal Calcutta Floral Gold Ring',
    category: 'Rings',
    subCategory: 'Floral Filigree',
    metal: 'GOLD',
    defaultPurity: '22K',
    hsnCode: '7113',
    standardMaking: 12.0,
    makingType: 'PERCENTAGE',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500',
    attributes: { gender: 'Women', occasion: 'Bridal', collection: 'Heritage 2026' },
    variants: [
      {
        id: 'var_rng_22k_001_18',
        productId: 'des_rng_22k_001',
        sku: 'RNG-22K-001-SZ18',
        variantName: 'Size 18 (Yellow Gold)',
        referenceWeight: 4.5,
        masterBarcode: 'SKU-RNG-001-18',
        attributes: { size: 18, metalTone: 'Yellow Gold' },
        isSerialized: true,
        stockCount: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'var_rng_22k_001_20',
        productId: 'des_rng_22k_001',
        sku: 'RNG-22K-001-SZ20',
        variantName: 'Size 20 (Yellow Gold)',
        referenceWeight: 5.2,
        masterBarcode: 'SKU-RNG-001-20',
        attributes: { size: 20, metalTone: 'Yellow Gold' },
        isSerialized: true,
        stockCount: 2,
        createdAt: new Date().toISOString(),
      },
    ],
    totalStockCount: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'des_nl_22k_042',
    businessId: 'default-tenant-sandhya',
    productCode: 'NL-ANT-042',
    name: 'Temple Antique Kundan Choker Necklace',
    category: 'Necklaces',
    subCategory: 'Antique Temple',
    metal: 'GOLD',
    defaultPurity: '22K',
    hsnCode: '7113',
    standardMaking: 15.5,
    makingType: 'PERCENTAGE',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500',
    attributes: { gender: 'Women', occasion: 'Wedding', collection: 'Kashi Heritage' },
    variants: [
      {
        id: 'var_nl_ant_042_std',
        productId: 'des_nl_22k_042',
        sku: 'NL-ANT-042-STD',
        variantName: 'Standard 16 Inch Choker',
        referenceWeight: 42.0,
        masterBarcode: 'SKU-NL-042-STD',
        attributes: { lengthInches: 16, finish: 'Antique Matte' },
        isSerialized: true,
        stockCount: 1,
        createdAt: new Date().toISOString(),
      },
    ],
    totalStockCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'des_coin_24k_10g',
    businessId: 'default-tenant-sandhya',
    productCode: 'COIN-24K-10G',
    name: 'Lakshmi Ganesh 24K 999 Fine Gold Coin (10g)',
    category: 'Coins & Bullion',
    subCategory: 'Fine Gold Coin',
    metal: 'GOLD',
    defaultPurity: '24K',
    hsnCode: '7108',
    standardMaking: 450,
    makingType: 'FIXED',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500',
    attributes: { assay: 'NABL Certified 999', packaging: 'Tamper-Evident CertiCard' },
    variants: [
      {
        id: 'var_coin_24k_10g_master',
        productId: 'des_coin_24k_10g',
        sku: 'COIN-24K-10G',
        variantName: '10g Sealed CertiCard Coin',
        referenceWeight: 10.0,
        masterBarcode: 'COIN-24K-10G',
        attributes: { weightGrams: 10 },
        isSerialized: false, // Non-serialized: fast-moving barcode
        stockCount: 25,
        createdAt: new Date().toISOString(),
      },
    ],
    totalStockCount: 25,
    createdAt: new Date().toISOString(),
  },
];

export function getSavedProductDesigns(): ProductDesignItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCT_DESIGNS;
  try {
    const raw = localStorage.getItem(CATALOGUE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATALOGUE_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCT_DESIGNS));
      return INITIAL_PRODUCT_DESIGNS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCT_DESIGNS;
  }
}

export function saveProductDesigns(designs: ProductDesignItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CATALOGUE_STORAGE_KEY, JSON.stringify(designs));
}

export function addProductDesign(input: CreateProductDesignInput): ProductDesignItem {
  const designs = getSavedProductDesigns();
  const id = `des_${Date.now()}`;
  const newDesign: ProductDesignItem = {
    id,
    businessId: 'default-tenant-sandhya',
    productCode: input.productCode.toUpperCase(),
    name: input.name,
    category: input.category,
    subCategory: input.subCategory || null,
    metal: input.metal,
    defaultPurity: input.defaultPurity,
    hsnCode: input.hsnCode || '7113',
    standardMaking: input.standardMaking || 0,
    makingType: input.makingType || 'PERCENTAGE',
    attributes: input.attributes || {},
    variants: [],
    mediaAssets: [],
    totalStockCount: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = [newDesign, ...designs];
  saveProductDesigns(updated);
  return newDesign;
}

export function addProductVariant(input: CreateProductVariantInput): ProductVariantItem {
  const designs = getSavedProductDesigns();
  const designIndex = designs.findIndex((d) => d.id === input.productId);
  if (designIndex === -1) throw new Error('Product design not found');

  const variantId = `var_${Date.now()}`;
  const newVariant: ProductVariantItem = {
    id: variantId,
    productId: input.productId,
    sku: input.sku.toUpperCase(),
    variantName: input.variantName,
    referenceWeight: input.referenceWeight || null,
    masterBarcode: input.masterBarcode || null,
    attributes: input.attributes || {},
    isSerialized: input.isSerialized ?? true,
    stockCount: 0,
    createdAt: new Date().toISOString(),
  };

  const targetDesign = designs[designIndex];
  targetDesign.variants = [...(targetDesign.variants || []), newVariant];
  designs[designIndex] = targetDesign;
  saveProductDesigns(designs);
  return newVariant;
}
