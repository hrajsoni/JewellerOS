/**
 * JewelleryOS Thermal Tag Layouts & Data Formatters
 *
 * Supports industry-standard jewellery label formats:
 * 1. 50x25mm Butterfly Jewellery Tag (Rings, Bangles, Necklaces, Pendants)
 *    - Left Wing: Barcode + Product Code + Shop Name
 *    - Bridge: Rat-tail loop (8mm width)
 *    - Right Wing: Gross Wt, Net Wt, Making Charges, HUID, Purity
 * 2. 38x25mm Dumbbell Jewellery Tag (Lightweight Chains, Bracelets, Nosepins)
 *    - Left Wing: Barcode + Product Code
 *    - Bridge: Narrow stem (8mm width)
 *    - Right Wing: Gross Wt, Net Wt, Making Charges, HUID
 */

export type CanonicalTagType = 'butterfly_50x25' | 'dumbbell_38x25';
export type ThermalTagType = CanonicalTagType | 'butterfly' | 'dumbbell';

export interface TagDimensionsMm {
  width: number;
  height: number;
  leftWingWidth: number;
  bridgeWidth: number;
  rightWingWidth: number;
}

export interface TagDimensionsDots {
  width: number;
  height: number;
  leftWingWidth: number;
  bridgeWidth: number;
  rightWingWidth: number;
}

export interface TagPrintableArea {
  marginMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
}

export interface ThermalTagLayout {
  canonicalType: CanonicalTagType;
  name: string;
  description: string;
  targetUse: string;
  dpi: number;
  dimensionsMm: TagDimensionsMm;
  dimensionsDots: TagDimensionsDots;
  cssPageSize: string;
  leftWingFields: string[];
  rightWingFields: string[];
  printableArea: TagPrintableArea;
}

export interface TagPresetConfig {
  name: string;
  description: string;
  targetUse: string;
  dimensionsMm: TagDimensionsMm;
  leftWingFields: string[];
  rightWingFields: string[];
  marginMm: number;
}

export const THERMAL_TAG_PRESETS: Record<CanonicalTagType, TagPresetConfig> = {
  butterfly_50x25: {
    name: '50x25mm Butterfly Jewellery Tag',
    description: 'Dual-wing butterfly label with central rat-tail loop bridge for rings, bangles, and necklaces',
    targetUse: 'Rings, Pendants, Bangles, Necklaces, Heavy Ornaments',
    dimensionsMm: {
      width: 50,
      height: 25,
      leftWingWidth: 21,
      bridgeWidth: 8,
      rightWingWidth: 21,
    },
    leftWingFields: ['barcode', 'productCode', 'shopName', 'purityBadge'],
    rightWingFields: ['grossWeight', 'netWeight', 'stoneWeight', 'makingCharges', 'huid', 'hsn'],
    marginMm: 0,
  },
  dumbbell_38x25: {
    name: '38x25mm Dumbbell Jewellery Tag',
    description: 'Compact dumbbell label with narrow neck for lightweight chains, bracelets, and nosepins',
    targetUse: 'Lightweight Chains, Bracelets, Nosepins, Delicate Jewellery',
    dimensionsMm: {
      width: 38,
      height: 25,
      leftWingWidth: 15,
      bridgeWidth: 8,
      rightWingWidth: 15,
    },
    leftWingFields: ['barcode', 'productCode', 'shopName'],
    rightWingFields: ['grossWeight', 'netWeight', 'makingCharges', 'huid', 'purityBadge'],
    marginMm: 0,
  },
};

/**
 * Normalizes input tag type string to standard canonical type.
 */
export function normalizeTagType(tagType: ThermalTagType | string): CanonicalTagType {
  const normalized = tagType.toLowerCase().trim();
  if (normalized === 'dumbbell' || normalized === 'dumbbell_38x25' || normalized.includes('38x25')) {
    return 'dumbbell_38x25';
  }
  return 'butterfly_50x25';
}

/**
 * Converts millimeters to dots/pixels based on printer DPI.
 * Standard thermal resolutions: 203 DPI (8 dots/mm) or 300 DPI (11.81 dots/mm).
 */
export function mmToDots(mm: number, dpi: number = 203): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Calculates complete layout geometry and printable areas for the given tag type and printer DPI.
 */
export function calculateTagLayout(
  tagType: ThermalTagType | string,
  dpi: number = 203
): ThermalTagLayout {
  const canonical = normalizeTagType(tagType);
  const preset = THERMAL_TAG_PRESETS[canonical];

  const dimensionsDots: TagDimensionsDots = {
    width: mmToDots(preset.dimensionsMm.width, dpi),
    height: mmToDots(preset.dimensionsMm.height, dpi),
    leftWingWidth: mmToDots(preset.dimensionsMm.leftWingWidth, dpi),
    bridgeWidth: mmToDots(preset.dimensionsMm.bridgeWidth, dpi),
    rightWingWidth: mmToDots(preset.dimensionsMm.rightWingWidth, dpi),
  };

  const printableArea: TagPrintableArea = {
    marginMm: preset.marginMm,
    printableWidthMm: preset.dimensionsMm.width - preset.marginMm * 2,
    printableHeightMm: preset.dimensionsMm.height - preset.marginMm * 2,
  };

  return {
    canonicalType: canonical,
    name: preset.name,
    description: preset.description,
    targetUse: preset.targetUse,
    dpi,
    dimensionsMm: { ...preset.dimensionsMm },
    dimensionsDots,
    cssPageSize: `${preset.dimensionsMm.width}mm ${preset.dimensionsMm.height}mm`,
    leftWingFields: [...preset.leftWingFields],
    rightWingFields: [...preset.rightWingFields],
    printableArea,
  };
}

/**
 * Formats weight to exact 3 decimal places (Indian Sarafa milligram trade standard).
 * e.g. 10.45 => "10.450g", 0 => "0.000g"
 */
export function formatWeight(weightInGrams?: number, unit: string = 'g'): string {
  if (weightInGrams === undefined || weightInGrams === null || isNaN(weightInGrams)) {
    return `0.000${unit}`;
  }
  const positiveWeight = Math.max(0, weightInGrams);
  return `${positiveWeight.toFixed(3)}${unit}`;
}

/**
 * Accurately derives Net Weight from Gross Weight, Stone Weight, and Other Deductions.
 */
export function calculateNetWeight(
  grossWeight: number = 0,
  stoneWeight: number = 0,
  otherDeductions: number = 0
): number {
  const g = isNaN(grossWeight) ? 0 : grossWeight;
  const s = isNaN(stoneWeight) ? 0 : stoneWeight;
  const d = isNaN(otherDeductions) ? 0 : otherDeductions;
  const net = Math.max(0, g - s - d);
  return Number(net.toFixed(3));
}

/**
 * Formats Making Charges for jewellery tag display.
 * Supports percentage, per_gram, and fixed making structures.
 */
export function formatMakingCharges(
  type?: 'percentage' | 'per_gram' | 'fixed' | string,
  value?: number
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'MK: 0%';
  }

  if (type === 'percentage') {
    return `MK: ${value}%`;
  }
  if (type === 'per_gram') {
    return `MK: ₹${value.toLocaleString('en-IN')}/g`;
  }
  if (type === 'fixed') {
    return `MK: ₹${value.toLocaleString('en-IN')}`;
  }

  // If type wasn't specified but value exists, default to %
  return `MK: ${value}%`;
}

/**
 * Formats BIS Hallmark Unique Identification (HUID) code.
 * Standard HUID is a 6-character alphanumeric string (e.g. "AB12CD").
 */
export function formatHuid(huid?: string): string {
  if (!huid || typeof huid !== 'string') {
    return 'HUID: N/A';
  }
  const clean = huid.trim().toUpperCase();
  if (clean.length === 0) {
    return 'HUID: N/A';
  }
  return `HUID: ${clean}`;
}

/**
 * Formats gold/silver purity badge.
 * e.g. "22K" => "22K (916)", "18K" => "18K (750)"
 */
export function formatPurityBadge(purity?: string, purityDisplay?: string): string {
  if (purityDisplay && purityDisplay.trim()) {
    return purityDisplay.trim();
  }
  if (!purity) return '22K';

  const clean = purity.toUpperCase().trim();
  if (clean === '22K' || clean.includes('916')) return '22K (916)';
  if (clean === '18K' || clean.includes('750')) return '18K (750)';
  if (clean === '14K' || clean.includes('585')) return '14K (585)';
  if (clean === '24K' || clean.includes('999')) return '24K (999)';
  if (clean.includes('925')) return '925 Silver';
  return clean;
}

export interface TagInputItem {
  barcode?: string;
  sku?: string;
  productCode?: string;
  name?: string;
  category?: string;
  grossWeight?: number;
  netWeight?: number;
  stoneWeight?: number;
  otherDeductions?: number;
  purity?: string;
  purityDisplay?: string;
  defaultMakingType?: 'percentage' | 'per_gram' | 'fixed' | string;
  defaultMakingValue?: number;
  makingCharges?:
    | {
        type?: 'percentage' | 'per_gram' | 'fixed' | string;
        value?: number;
      }
    | string;
  huid?: string;
  hsnCode?: string;
  trayLocation?: string;
  shopName?: string;
}

export interface FormattedThermalTagData {
  barcode: string;
  productCode: string;
  shopName: string;
  purityBadge: string;
  grossWeightFormatted: string; // "GW: 10.450g"
  netWeightFormatted: string;   // "NW: 9.800g"
  stoneWeightFormatted: string; // "SW: 0.650g" or ""
  makingFormatted: string;      // "MK: ₹450/g"
  huidFormatted: string;        // "HUID: AB12CD"
  hsnFormatted: string;         // "HSN: 7113"
  trayLocation?: string;
  raw: {
    grossWeight: number;
    netWeight: number;
    stoneWeight: number;
    huid: string;
  };
}

/**
 * Prepares and formats all piece fields into printable tag data for butterfly and dumbbell labels.
 */
export function formatTagData(
  item: TagInputItem,
  defaultShopName: string = 'JEWELBILL SHOWROOM'
): FormattedThermalTagData {
  const barcode = item.barcode?.trim() || item.sku?.trim() || item.productCode?.trim() || 'JW-00000000';
  const productCode = item.productCode?.trim() || item.sku?.trim() || barcode;
  const shopName = (item.shopName || defaultShopName).trim().toUpperCase();
  const purityBadge = formatPurityBadge(item.purity, item.purityDisplay);

  const grossWeight = item.grossWeight ?? 0;
  const stoneWeight = item.stoneWeight ?? 0;
  const deductions = item.otherDeductions ?? 0;
  const netWeight = item.netWeight !== undefined && !isNaN(item.netWeight)
    ? item.netWeight
    : calculateNetWeight(grossWeight, stoneWeight, deductions);

  let makingType: 'percentage' | 'per_gram' | 'fixed' | string | undefined = item.defaultMakingType;
  let makingValue: number | undefined = item.defaultMakingValue;

  if (item.makingCharges && typeof item.makingCharges === 'object') {
    makingType = item.makingCharges.type || makingType;
    makingValue = item.makingCharges.value ?? makingValue;
  }

  const makingFormatted = typeof item.makingCharges === 'string'
    ? item.makingCharges
    : formatMakingCharges(makingType, makingValue);

  const huidFormatted = formatHuid(item.huid);
  const hsnFormatted = `HSN: ${item.hsnCode || '7113'}`;

  return {
    barcode,
    productCode,
    shopName,
    purityBadge,
    grossWeightFormatted: `GW: ${formatWeight(grossWeight)}`,
    netWeightFormatted: `NW: ${formatWeight(netWeight)}`,
    stoneWeightFormatted: stoneWeight > 0 ? `SW: ${formatWeight(stoneWeight)}` : '',
    makingFormatted,
    huidFormatted,
    hsnFormatted,
    trayLocation: item.trayLocation,
    raw: {
      grossWeight,
      netWeight,
      stoneWeight,
      huid: item.huid || '',
    },
  };
}

/**
 * Returns print-ready CSS formatting for thermal label printers.
 */
export function generateThermalPrintCss(tagType: ThermalTagType = 'butterfly_50x25'): string {
  const layout = calculateTagLayout(tagType);
  const { width, height } = layout.dimensionsMm;

  return `
@page {
  size: ${width}mm ${height}mm;
  margin: 0;
}

@media print {
  html, body {
    width: ${width}mm;
    height: ${height}mm;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body * {
    visibility: hidden;
  }

  .thermal-tag-printable,
  .thermal-tag-printable * {
    visibility: visible;
  }

  .thermal-tag-printable {
    position: absolute;
    left: 0;
    top: 0;
    width: ${width}mm;
    height: ${height}mm;
    margin: 0;
    padding: 0;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
`.trim();
}
