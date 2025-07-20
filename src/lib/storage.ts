import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import sharp from 'sharp';
import { env } from 'process';

const STORAGE_PROVIDER = env.STORAGE_PROVIDER || 'local';
const BUCKET_NAME = env.DO_SPACES_BUCKET || '';

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH_HEIGHT = 1920; 

let s3Client: S3Client | null = null;

// Note: these env vars are configured in DigitalOcean. Locally, we just save 
// files to the public/uploads directory.
if (STORAGE_PROVIDER === 'do_spaces') {
  if (!env.DO_SPACES_KEY || !env.DO_SPACES_SECRET || !env.DO_SPACES_ENDPOINT || !env.DO_SPACES_REGION || !BUCKET_NAME) {
    throw new Error('DigitalOcean Spaces environment variables are not fully configured.');
  }
  s3Client = new S3Client({
    region: env.DO_SPACES_REGION,
    endpoint: env.DO_SPACES_ENDPOINT,
    forcePathStyle: true, // Required for DigitalOcean Spaces
    credentials: {
      accessKeyId: env.DO_SPACES_KEY,
      secretAccessKey: env.DO_SPACES_SECRET,
    },
  });
}

async function validateAndResizeImage(file: File): Promise<Buffer> {
  if (!file || file.size === 0) {
    throw new Error('No file provided.');
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error('Invalid file format. Only JPG, PNG, and WebP are allowed.');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return sharp(buffer).rotate().resize({ width: MAX_WIDTH_HEIGHT, height: MAX_WIDTH_HEIGHT }).toBuffer();
}

export async function uploadFile(file: File, prefix: string, entityId: string | number): Promise<string> {
  const resizedBuffer = await validateAndResizeImage(file);
  const extension = file.type.split('/')[1];
  const filename = `${entityId}.${Date.now()}.${extension}`;
  const key = `${prefix}/${filename}`;

  if (STORAGE_PROVIDER === 'do_spaces' && s3Client) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: resizedBuffer,
      ACL: 'private',
      ContentType: file.type,
    });
    await s3Client.send(command);
    return key;
  } else {
    const uploadsDir = path.join(process.cwd(), 'public/uploads', prefix);
    const filepath = path.join(uploadsDir, filename);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(filepath, resizedBuffer);
    // Return a path relative to the `public`// For local storage, ensure the path is a valid root-relative URL
    return `uploads/${key}`;
  }
}

export async function getPublicUrl(storagePath: string | null | undefined): Promise<string> {
  // 1. Handle the case where there is no image path.
  if (!storagePath) {
    return '/images/default-avatar.png';
  }

  // 2. Handle full external URLs.
  if (storagePath.startsWith('http')) {
    return storagePath;
  }

  // 3. Handle legacy local paths (stored in the public/uploads directory).
  // These paths are stored as 'uploads/...' and need a leading slash.
  if (storagePath.startsWith('uploads/')) {
    return `/${storagePath}`;
  }

  // 4. Handle new DigitalOcean Spaces paths by routing them through our secure proxy.
  // These paths are stored as 'user-photos/...' and need to be prefixed.
  if (STORAGE_PROVIDER === 'do_spaces') {
    return `/api/images?key=${storagePath}`;
  }

  // 5. Fallback for any other path, ensuring it's a valid root-relative URL.
  return `/${storagePath.replace(/^\/+/,'')}`;
}

export async function deleteFile(storagePath: string): Promise<void> {
  if (!storagePath) return;

  if (STORAGE_PROVIDER === 'do_spaces' && s3Client) {
    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: storagePath });
    try {
      await s3Client.send(command);
    } catch (error) {
      console.error(`Failed to delete S3 object: ${storagePath}`, error);
    }
  } else {
    try {
      // storagePath is relative to `public`, so we join it directly
      const filepath = path.join(process.cwd(), 'public', storagePath);
      await unlink(filepath);
    } catch (e: unknown) {
      const error = e as { code?: string };
      // It's okay if the file doesn't exist
      if (error.code !== 'ENOENT') {
        console.error(`Failed to delete local file: ${storagePath}`, error);
      }
    }
  }
}
