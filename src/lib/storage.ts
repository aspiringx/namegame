import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import sharp from 'sharp';
import { env } from 'process';

const STORAGE_PROVIDER = env.STORAGE_PROVIDER || 'local';
const BUCKET_NAME = env.DO_SPACES_BUCKET || '';

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 400;

let s3Client: S3Client | null = null;

// Note: these env vars are configured in DigitalOcean. Locally, we just save 
// files to the public/uploads directory.
if (STORAGE_PROVIDER === 'do_spaces') {
  if (!env.DO_SPACES_KEY || !env.DO_SPACES_SECRET || !env.DO_SPACES_ENDPOINT || !env.DO_SPACES_REGION || !BUCKET_NAME) {
    throw new Error('DigitalOcean Spaces environment variables are not fully configured.');
  }
  s3Client = new S3Client({
    endpoint: env.DO_SPACES_ENDPOINT,
    region: env.DO_SPACES_REGION,
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

  return sharp(buffer).resize({ width: MAX_WIDTH }).toBuffer();
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
    // Return a path relative to the `public` directory, without a leading slash
    return `uploads/${key}`;
  }
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

export async function getPublicUrl(storagePath: string | null | undefined): Promise<string> {
  if (!storagePath) {
    // Return a default placeholder image
    return '/images/default-avatar.png';
  }

  // If the path is already a full URL, return it as is.
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  if (STORAGE_PROVIDER === 'do_spaces' && s3Client) {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: storagePath });
    // Generate a signed URL that expires in 1 hour (3600 seconds)
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } else {
    // For local storage, ensure the path is a valid root-relative URL
    return `/${storagePath.replace(/^\/+|\/$/g, '')}`;
  }
}
