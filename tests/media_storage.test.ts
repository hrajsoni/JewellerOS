import { test, describe } from 'node:test';
import assert from 'node:assert';
import sharp from 'sharp';
import {
  validateImageMime,
  stripMetadataAndConvertToWebp,
  generateThumbnails,
  processJewelleryImage,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from '../src/lib/media/imageProcessor';
import {
  buildMediaStorageKey,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
} from '../src/lib/media/s3Client';

describe('JewelleryOS Media Storage & Sharp Pipeline Tests', () => {
  // Helper to create valid image buffers using sharp
  async function createTestImageBuffer(
    format: 'png' | 'jpeg' | 'webp',
    width = 200,
    height = 200
  ): Promise<Buffer> {
    const pipeline = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 197, g: 160, b: 89 }, // Sarafa Gold #C5A059
      },
    });

    if (format === 'png') return pipeline.png().toBuffer();
    if (format === 'jpeg') return pipeline.jpeg().toBuffer();
    return pipeline.webp().toBuffer();
  }

  describe('1. MIME Magic Number Validation & Buffer Security', () => {
    test('Validates real PNG image buffer', async () => {
      const buffer = await createTestImageBuffer('png');
      const result = await validateImageMime(buffer);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.mime, 'image/png');
      assert.strictEqual(result.extension, 'png');
    });

    test('Validates real JPEG image buffer', async () => {
      const buffer = await createTestImageBuffer('jpeg');
      const result = await validateImageMime(buffer);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.mime, 'image/jpeg');
      assert.strictEqual(result.extension, 'jpg');
    });

    test('Validates real WebP image buffer', async () => {
      const buffer = await createTestImageBuffer('webp');
      const result = await validateImageMime(buffer);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.mime, 'image/webp');
      assert.strictEqual(result.extension, 'webp');
    });

    test('Rejects plain text file disguised as an image', async () => {
      const textBuffer = Buffer.from('This is a plain ASCII text file, not a valid binary image.');
      const result = await validateImageMime(textBuffer);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error?.includes('Unrecognized file format') || result.error?.includes('Unsupported'));
    });

    test('Rejects PDF document format', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 standard document structure');
      const result = await validateImageMime(pdfBuffer);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error?.includes('Unsupported MIME type') || result.error?.includes('Unrecognized'));
    });

    test('Rejects 0-byte empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await validateImageMime(emptyBuffer);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error?.includes('Empty file'));
    });

    test('Rejects files exceeding 10MB limit', async () => {
      const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
      const result = await validateImageMime(oversizedBuffer);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error?.includes('exceeds'));
    });
  });

  describe('2. S3 Storage Key & Multi-Tenant Path Isolation', () => {
    test('Generates tenant-isolated storage key for product design', () => {
      const key = buildMediaStorageKey({
        businessId: 'tenant-sandhya-jaipur',
        category: 'products',
        entityId: 'des_rng_001',
        variant: 'original',
        fileName: 'model_render.webp',
      });

      assert.strictEqual(
        key,
        'business/tenant-sandhya-jaipur/products/des_rng_001/original/model_render.webp'
      );
      assert.ok(key.startsWith('business/tenant-sandhya-jaipur/'));
    });

    test('Generates tenant-isolated storage key for individual stock piece', () => {
      const key = buildMediaStorageKey({
        businessId: 'tenant-sandhya-jaipur',
        category: 'inventory',
        entityId: 'stock_item_18452',
        variant: 'macro',
        fileName: 'huid_macro.webp',
      });

      assert.strictEqual(
        key,
        'business/tenant-sandhya-jaipur/inventory/stock_item_18452/macro/huid_macro.webp'
      );
    });

    test('Proves two competing tenants never collide in storage key space', () => {
      const keyA = buildMediaStorageKey({
        businessId: 'tenant-sandhya-jaipur',
        category: 'products',
        entityId: 'item-1',
        fileName: 'ring.webp',
      });

      const keyB = buildMediaStorageKey({
        businessId: 'tenant-tanishq-delhi',
        category: 'products',
        entityId: 'item-1',
        fileName: 'ring.webp',
      });

      assert.notStrictEqual(keyA, keyB);
      assert.ok(keyA.includes('tenant-sandhya-jaipur'));
      assert.ok(keyB.includes('tenant-tanishq-delhi'));
    });

    test('Sanitizes directory traversal patterns from file names', () => {
      const key = buildMediaStorageKey({
        businessId: 'tenant-sandhya-jaipur',
        category: 'products',
        entityId: 'item-1',
        fileName: '../../../etc/passwd.webp',
      });

      assert.ok(!key.includes('..'));
      assert.ok(key.startsWith('business/tenant-sandhya-jaipur/'));
    });
  });

  describe('3. Sharp Image Processing & WebP Conversion', () => {
    test('Converts PNG to optimized WebP format and extracts metadata', async () => {
      const pngBuffer = await createTestImageBuffer('png', 400, 300);
      const converted = await stripMetadataAndConvertToWebp(pngBuffer);

      assert.ok(converted.buffer.length > 0);
      assert.strictEqual(converted.mimeType, 'image/webp');
      assert.strictEqual(converted.width, 400);
      assert.strictEqual(converted.height, 300);
    });

    test('Generates multi-resolution thumbnails (sm_150, md_400, lg_1080)', async () => {
      const imageBuffer = await createTestImageBuffer('jpeg', 1200, 800);
      const thumbnails = await generateThumbnails(imageBuffer);

      assert.ok(thumbnails.sm_150);
      assert.ok(thumbnails.md_400);
      assert.ok(thumbnails.lg_1080);

      // Verify sm_150 dimensions
      const smMeta = await sharp(thumbnails.sm_150.buffer).metadata();
      assert.strictEqual(smMeta.width, 150);
      assert.strictEqual(smMeta.height, 150);
      assert.strictEqual(smMeta.format, 'webp');

      // Verify md_400 fit inside aspect ratio
      const mdMeta = await sharp(thumbnails.md_400.buffer).metadata();
      assert.ok((mdMeta.width || 0) <= 400);
      assert.ok((mdMeta.height || 0) <= 400);
      assert.strictEqual(mdMeta.format, 'webp');
    });

    test('Executes end-to-end pipeline (validate -> optimize -> thumbnails)', async () => {
      const rawBuffer = await createTestImageBuffer('png', 600, 600);
      const result = await processJewelleryImage(rawBuffer);

      assert.strictEqual(result.optimized.mimeType, 'image/webp');
      assert.strictEqual(result.optimized.width, 600);
      assert.strictEqual(result.optimized.height, 600);
      assert.ok(result.thumbnails.sm_150.buffer.length > 0);
      assert.ok(result.thumbnails.md_400.buffer.length > 0);
      assert.strictEqual(result.originalMime, 'image/png');
    });
  });

  describe('4. S3 Pre-Signed URL Client', () => {
    test('Generates pre-signed upload URL with 15-minute expiration', async () => {
      const key = 'business/tenant-sandhya-jaipur/products/p1/original/ring.webp';
      const uploadUrl = await getPresignedUploadUrl({
        storageKey: key,
        contentType: 'image/webp',
      });

      assert.ok(typeof uploadUrl === 'string');
      assert.ok(uploadUrl.includes('X-Amz-Signature') || uploadUrl.includes('X-Amz-Algorithm'));
      assert.ok(uploadUrl.includes('X-Amz-Expires=900'));
    });

    test('Generates pre-signed download URL for secure client access', async () => {
      const key = 'business/tenant-sandhya-jaipur/products/p1/original/ring.webp';
      const downloadUrl = await getPresignedDownloadUrl(key);

      assert.ok(typeof downloadUrl === 'string');
      assert.ok(downloadUrl.includes('X-Amz-Signature') || downloadUrl.includes('X-Amz-Algorithm'));
      assert.ok(downloadUrl.includes('X-Amz-Expires=900'));
    });
  });
});
