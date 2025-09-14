'use server'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
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

const IMAGE_SIZES = {
  thumb: { width: 150, height: 150, quality: 80 },
  small: { width: 400, height: 400, quality: 85 },
  medium: { width: 800, height: 800, quality: 90 },
  large: { width: 1200, height: 1200, quality: 90 },
} as const

export interface UploadedUrls {
  url: string
  url_thumb?: string
  url_small?: string
  url_medium?: string
  url_large?: string
}

async function uploadToStorage(key: string, body: Buffer, contentType: string) {
  if (STORAGE_PROVIDER === 'do_spaces' && s3Client) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ACL: 'private',
      ContentType: contentType,
    })
    await s3Client.send(command)
  } else {
    // Key is expected as 'prefix/filename'
    const [prefix, filename] = key.split('/')
    const uploadsDir = path.join(process.cwd(), 'public/uploads', prefix)
    const filepath = path.join(uploadsDir, filename)
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(filepath, body)
  }
}

export async function uploadFile(
  file: File,
  prefix: string,
  entityId: string | number,
): Promise<UploadedUrls> {
  if (!file || file.size === 0) {
    throw new Error('No file provided.')
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error(
      'Invalid file format. Only JPG, PNG, WebP, and GIF are allowed.',
    )
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    )
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer())
  const timestamp = Date.now()

  const sharpInstance = sharp(originalBuffer).rotate()

  // 1. Handle the original image
  const originalExtension = file.type.split('/')[1]
  const originalFilename = `${entityId}.${timestamp}.original.${originalExtension}`
  const originalKey = `${prefix}/${originalFilename}`

  // 2. Prepare resized WebP versions
  const uploadPromises = Object.entries(IMAGE_SIZES).map(
    async ([size, config]) => {
      const webpBuffer = await sharpInstance
        .clone()
        .resize({
          width: config.width,
          height: config.height,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: config.quality })
        .toBuffer()

      const webpFilename = `${entityId}.${timestamp}.${size}.webp`
      const webpKey = `${prefix}/${webpFilename}`

      // Upload is awaited here to ensure it completes before returning the key
      await uploadToStorage(webpKey, webpBuffer, 'image/webp')
      return { size: `url_${size}`, key: webpKey }
    },
  )

  // 3. Concurrently execute all uploads and gather results
  const allUploads = await Promise.allSettled([
    uploadToStorage(originalKey, originalBuffer, file.type),
    ...uploadPromises,
  ])

  // 4. Construct the result object from successful uploads
  const uploadedUrls: UploadedUrls = { url: originalKey } // Assume original always works for now

  allUploads.slice(1).forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { size, key } = result.value
      uploadedUrls[size as keyof UploadedUrls] = key
    } else if (result.status === 'rejected') {
      console.error('A resize operation failed:', result.reason)
    }
  })

  // For local dev, we need to adjust the keys to be valid paths
  if (STORAGE_PROVIDER === 'local') {
    for (const key in uploadedUrls) {
      const urlKey = key as keyof UploadedUrls
      if (uploadedUrls[urlKey]) {
        uploadedUrls[urlKey] = `uploads/${uploadedUrls[urlKey]}`
      }
    }
  }

  return uploadedUrls
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
