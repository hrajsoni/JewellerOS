import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface ImageValidationResult {
  isValid: boolean;
  mime?: AllowedMimeType;
  extension?: string;
  error?: string;
}

export interface ProcessedThumbnail {
  name: 'sm_150' | 'md_400' | 'lg_1080';
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  mimeType: 'image/webp';
}

export interface ProcessedImageResult {
  originalMime: AllowedMimeType;
  originalSize: number;
  width: number;
  height: number;
  optimized: {
    buffer: Buffer;
    width: number;
    height: number;
    size: number;
    mimeType: 'image/webp';
  };
  thumbnails: {
    sm_150: ProcessedThumbnail;
    md_400: ProcessedThumbnail;
    lg_1080: ProcessedThumbnail;
  };
}

/**
 * Inspects buffer magic numbers using file-type to validate MIME against allowed types.
 * Rejects fake, malicious, or non-whitelisted files and enforces max size (10MB).
 */
export async function validateImageMime(buffer: Buffer): Promise<ImageValidationResult> {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'Empty file buffer provided.' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds 10MB limit: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    return {
      isValid: false,
      error: 'Unrecognized file format or non-binary file disguised as image.',
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(detected.mime as AllowedMimeType)) {
    return {
      isValid: false,
      error: `Unsupported MIME type: '${detected.mime}'. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return {
    isValid: true,
    mime: detected.mime as AllowedMimeType,
    extension: detected.ext,
  };
}

/**
 * Strips camera EXIF metadata, auto-orients, and converts the image to optimized WebP.
 */
export async function stripMetadataAndConvertToWebp(
  buffer: Buffer,
  options?: { quality?: number }
): Promise<{ buffer: Buffer; width: number; height: number; size: number; mimeType: 'image/webp' }> {
  const quality = options?.quality ?? 85;

  // Sharp strips all EXIF/XMP/IPTC metadata by default unless .withMetadata() is explicitly invoked.
  // .rotate() auto-orients based on EXIF orientation tag before stripping.
  const webpBuffer = await sharp(buffer)
    .rotate()
    .webp({ quality, effort: 4 })
    .toBuffer();

  const meta = await sharp(webpBuffer).metadata();

  return {
    buffer: webpBuffer,
    width: meta.width || 0,
    height: meta.height || 0,
    size: webpBuffer.length,
    mimeType: 'image/webp',
  };
}

/**
 * Generates multi-resolution thumbnails in WebP format with stripped EXIF:
 * - sm_150: 150x150 fit cover
 * - md_400: 400x400 fit inside
 * - lg_1080: 1080x1080 fit inside
 */
export async function generateThumbnails(buffer: Buffer): Promise<{
  sm_150: ProcessedThumbnail;
  md_400: ProcessedThumbnail;
  lg_1080: ProcessedThumbnail;
}> {
  // Generate all 3 thumbnail tiers in parallel
  const [smBuffer, mdBuffer, lgBuffer] = await Promise.all([
    sharp(buffer)
      .rotate()
      .resize(150, 150, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80, effort: 4 })
      .toBuffer(),
    sharp(buffer)
      .rotate()
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer(),
    sharp(buffer)
      .rotate()
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toBuffer(),
  ]);

  const [smMeta, mdMeta, lgMeta] = await Promise.all([
    sharp(smBuffer).metadata(),
    sharp(mdBuffer).metadata(),
    sharp(lgBuffer).metadata(),
  ]);

  return {
    sm_150: {
      name: 'sm_150',
      buffer: smBuffer,
      width: smMeta.width || 150,
      height: smMeta.height || 150,
      size: smBuffer.length,
      mimeType: 'image/webp',
    },
    md_400: {
      name: 'md_400',
      buffer: mdBuffer,
      width: mdMeta.width || 400,
      height: mdMeta.height || 400,
      size: mdBuffer.length,
      mimeType: 'image/webp',
    },
    lg_1080: {
      name: 'lg_1080',
      buffer: lgBuffer,
      width: lgMeta.width || 1080,
      height: lgMeta.height || 1080,
      size: lgBuffer.length,
      mimeType: 'image/webp',
    },
  };
}

/**
 * End-to-end pipeline: validates buffer MIME, strips EXIF, converts to optimized WebP,
 * and generates multi-resolution thumbnails.
 */
export async function processJewelleryImage(buffer: Buffer): Promise<ProcessedImageResult> {
  const validation = await validateImageMime(buffer);
  if (!validation.isValid || !validation.mime) {
    throw new Error(validation.error || 'Invalid image buffer');
  }

  const [originalMeta, optimized, thumbnails] = await Promise.all([
    sharp(buffer).metadata(),
    stripMetadataAndConvertToWebp(buffer),
    generateThumbnails(buffer),
  ]);

  return {
    originalMime: validation.mime,
    originalSize: buffer.length,
    width: originalMeta.width || optimized.width,
    height: originalMeta.height || optimized.height,
    optimized,
    thumbnails,
  };
}
