import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || process.env.NEON_STORAGE_REGION || 'us-east-2';
const ENDPOINT = process.env.NEON_STORAGE_ENDPOINT || undefined; // If custom S3 endpoint used
export const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET || 'jewelbill-product-media';

// Initialize S3-compatible client for Neon Object Storage
export const s3Client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.NEON_STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.NEON_STORAGE_SECRET_KEY || '',
  },
  forcePathStyle: Boolean(ENDPOINT), // Path-style required for custom S3-compatible endpoints
});

/**
 * Sanitizes path segments to guarantee strict tenant isolation and prevent directory traversal.
 */
function sanitizePathComponent(segment: string): string {
  if (!segment) return '';
  return segment
    .replace(/\\/g, '/')
    .replace(/\.\.+/g, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Builds the strict tenant-isolated object key for jewellery media assets.
 * Format: business/{businessId}/{category}/{entityId}/{variant}/{fileName}
 */
export function buildMediaStorageKey(params: {
  businessId: string;
  category: 'products' | 'inventory' | 'documents' | 'branding';
  entityId: string;
  variant?: 'original' | 'thumbnails' | 'macro' | 'documents';
  fileName: string;
}): string {
  const { businessId, category, entityId, variant = 'original', fileName } = params;
  const cleanBusinessId = sanitizePathComponent(businessId) || 'default-tenant';
  const cleanEntityId = sanitizePathComponent(entityId) || 'default-entity';
  const cleanFileName = sanitizePathComponent(fileName) || 'file.webp';
  return `business/${cleanBusinessId}/${category}/${cleanEntityId}/${variant}/${cleanFileName}`;
}

/**
 * Generates a pre-signed PUT URL for direct browser-to-S3 uploads.
 * Valid for 15 minutes (900 seconds).
 */
export async function getPresignedUploadUrl(params: {
  storageKey: string;
  contentType: string;
  maxSizeBytes?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: params.storageKey,
    ContentType: params.contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 900 });
}

/**
 * Generates a pre-signed GET URL for secure media access.
 * Valid for 15 minutes (900 seconds).
 */
export async function getPresignedDownloadUrl(storageKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 900 });
}

/**
 * Deletes an object from object storage.
 */
export async function deleteStorageObject(storageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  await s3Client.send(command);
}

/**
 * Uploads an in-memory buffer directly to S3-compatible storage.
 */
export async function uploadStorageObject(params: {
  storageKey: string;
  buffer: Buffer;
  contentType: string;
}): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: params.storageKey,
    Body: params.buffer,
    ContentType: params.contentType,
  });

  await s3Client.send(command);
}
