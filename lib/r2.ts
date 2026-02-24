import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// R2 client configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Upload a file to R2 with tenant isolation
 * All files are stored under /{tenantId}/... path prefix
 */
export async function uploadFile(
  tenantId: number,
  file: Buffer | ArrayBuffer | Uint8Array,
  path: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  // Construct the full path with tenantId prefix for isolation
  const fullPath = `${tenantId}/${path}`;

  // Convert to Buffer if needed
  const fileBuffer = file instanceof ArrayBuffer ? Buffer.from(file) : file;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fullPath,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Return the public URL
  return getPublicUrl(tenantId, path);
}

/**
 * Get the public URL for a file
 */
export function getPublicUrl(tenantId: number, path: string): string {
  return `${PUBLIC_URL}/${tenantId}/${path}`;
}

/**
 * Delete a file from R2
 */
export async function deleteFile(
  tenantId: number,
  path: string
): Promise<void> {
  const fullPath = `${tenantId}/${path}`;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fullPath,
  });

  await r2Client.send(command);
}

/**
 * Generate a unique filename for uploads
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop() || '';
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Common upload paths for different file types
 */
export const UploadPaths = {
  inventory: (stoneId: number, filename: string) =>
    `inventory/${stoneId}/${filename}`,
  orderPhoto: (orderId: number, filename: string) =>
    `orders/${orderId}/${filename}`,
  aiRender: (orderId: number, filename: string) =>
    `ai-renders/${orderId}/${filename}`,
  splat: (orderId: number) => `splats/${orderId}.spz`,
  logo: (filename: string) => `branding/logo/${filename}`,
  banner: (filename: string) => `branding/banner/${filename}`,
} as const;

/**
 * Validate file type for uploads
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  ...ALLOWED_IMAGE_TYPES,
];
