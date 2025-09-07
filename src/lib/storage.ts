'use server'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'
import { writeFile, unlink, mkdir } from 'fs/promises'
import sharp from 'sharp'
import { env } from 'process'

const STORAGE_PROVIDER =
  process.env.NEXT_PUBLIC_STORAGE_PROVIDER === 'do_spaces'
    ? 'do_spaces'
    : 'local'
const BUCKET_NAME = env.DO_SPACES_BUCKET || ''

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_WIDTH_HEIGHT = 3840

let s3Client: S3Client | null = null

// Note: these env vars are configured in DigitalOcean. Locally, we just save
// files to the public/uploads directory.
if (STORAGE_PROVIDER === 'do_spaces') {
  if (
    !env.DO_SPACES_KEY ||
    !env.DO_SPACES_SECRET ||
    !env.DO_SPACES_ENDPOINT ||
    !env.DO_SPACES_REGION ||
    !BUCKET_NAME
  ) {
    throw new Error(
      'DigitalOcean Spaces environment variables are not fully configured.',
    )
  }
  s3Client = new S3Client({
    region: env.DO_SPACES_REGION,
    endpoint: env.DO_SPACES_ENDPOINT,
    forcePathStyle: true, // Required for DigitalOcean Spaces
    credentials: {
      accessKeyId: env.DO_SPACES_KEY,
      secretAccessKey: env.DO_SPACES_SECRET,
    },
  })
}

async function validateAndResizeImage(file: File): Promise<Buffer> {
  if (!file || file.size === 0) {
    throw new Error('No file provided.')
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error(
      'Invalid file format. Only JPG, PNG, WebP, and GIF are allowed.',
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return sharp(buffer)
    .rotate()
    .resize({
      width: MAX_WIDTH_HEIGHT,
      height: MAX_WIDTH_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer()
}

export async function uploadFile(
  file: File,
  prefix: string,
  entityId: string | number,
): Promise<string> {
  const processedBuffer = await validateAndResizeImage(file)
  const extension = file.type.split('/')[1]
  const filename = `${entityId}.${Date.now()}.${extension}`
  const key = `${prefix}/${filename}`

  if (STORAGE_PROVIDER === 'do_spaces' && s3Client) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ACL: 'private',
      ContentType: file.type,
    })
    await s3Client.send(command)
    return key
  } else {
    const uploadsDir = path.join(process.cwd(), 'public/uploads', prefix)
    const filepath = path.join(uploadsDir, filename)
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(filepath, processedBuffer)
    // Return a path relative to the `public`// For local storage, ensure the path is a valid root-relative URL
    return `uploads/${key}`
  }
}

export async function getPublicUrl(
  storagePath: string | null | undefined,
): Promise<string> {
  // 1. Handle null or undefined paths.
  if (!storagePath) {
    return '/images/default-avatar.png'
  }

  // 2. If it's already a full URL, return it as is.
  if (storagePath.startsWith('http')) {
    return storagePath
  }

  // 3. If it's a legacy local path or a new local path, make it a root-relative URL.
  if (
    STORAGE_PROVIDER === 'local' ||
    storagePath.startsWith('uploads/') ||
    storagePath.startsWith('/uploads/')
  ) {
    return `/${storagePath.replace(/^\/?uploads\//, 'uploads/')}`
  }

  // 4. If it's already a proxied path, return it as is.
  if (storagePath.startsWith('/api/images')) {
    return storagePath
  }

  // 5. For all other cases (assumed to be S3 keys), route them through the proxy.
  return `/api/images?key=${storagePath}`
}

export async function deleteFile(storagePath: string): Promise<void> {
  if (!storagePath) return

  if (STORAGE_PROVIDER === 'do_spaces' && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
    })
    try {
      await s3Client.send(command)
    } catch (error) {
      console.error(`Failed to delete S3 object: ${storagePath}`, error)
    }
  } else {
    try {
      // storagePath might be a root-relative URL (/uploads/...), so we normalize it
      const relativePath = storagePath.startsWith('/')
        ? storagePath.substring(1)
        : storagePath
      const filepath = path.join(process.cwd(), 'public', relativePath)
      await unlink(filepath)
    } catch (e: unknown) {
      const error = e as { code?: string }
      // It's okay if the file doesn't exist
      if (error.code !== 'ENOENT') {
        console.error(`Failed to delete local file: ${storagePath}`, error)
      }
    }
  }
}
