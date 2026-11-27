import bwipjs from 'bwip-js';

export interface BarcodeRenderOptions {
  scale?: number;
  height?: number;
  includeText?: boolean;
  textXAlign?: 'left' | 'center' | 'right';
  altText?: string;
}

/**
 * Validates whether the given text can be encoded in Code-128.
 * Code-128 requires non-empty string and standard ASCII characters (0x00 - 0x7F).
 */
export function isValidCode128Text(text: unknown): text is string {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  // Code 128 accepts standard ASCII characters (0x00 to 0x7F)
  return /^[\x00-\x7F]+$/.test(trimmed);
}

/**
 * Generates an SVG string representation of a Code-128 barcode.
 * Code-128 is high-density alphanumeric and standard for jewellery tags.
 */
export async function generateCode128Svg(
  text: string,
  options: BarcodeRenderOptions = {}
): Promise<string> {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Barcode text cannot be empty or whitespace-only');
  }

  const trimmed = text.trim();
  if (!/^[\x00-\x7F]+$/.test(trimmed)) {
    throw new Error('Barcode text contains invalid characters for Code-128 (ASCII only)');
  }

  const {
    scale = 3,
    height = 10,
    includeText = true,
    textXAlign = 'center',
    altText,
  } = options;

  const bwipOptions: any = {
    bcid: 'code128',
    text: trimmed,
    scale,
    height,
    includetext: includeText,
    textxalign: textXAlign,
  };

  // Only assign alttext if explicitly defined to avoid bwip-js undefined option type error
  if (altText !== undefined) {
    bwipOptions.alttext = altText;
  }

  // bwipjs.toSVG in Node returns the SVG string directly (synchronous)
  try {
    const svg = (bwipjs as any).toSVG(bwipOptions);
    return Promise.resolve(svg);
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Generates a Base64 PNG data URL of a Code-128 barcode.
 * Ideal for thermal printer direct image canvas drawing.
 */
export async function generateCode128PngDataUrl(
  text: string,
  options: BarcodeRenderOptions = {}
): Promise<string> {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Barcode text cannot be empty or whitespace-only');
  }

  const trimmed = text.trim();
  if (!/^[\x00-\x7F]+$/.test(trimmed)) {
    throw new Error('Barcode text contains invalid characters for Code-128 (ASCII only)');
  }

  const {
    scale = 3,
    height = 12,
    includeText = true,
    textXAlign = 'center',
    altText,
  } = options;

  const bwipOptions: any = {
    bcid: 'code128',
    text: trimmed,
    scale,
    height,
    includetext: includeText,
    textxalign: textXAlign,
  };

  if (altText !== undefined) {
    bwipOptions.alttext = altText;
  }

  try {
    const pngBuffer: Buffer = await (bwipjs as any).toBuffer(bwipOptions);
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (err) {
    throw err;
  }
}
