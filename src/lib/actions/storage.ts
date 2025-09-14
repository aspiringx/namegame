'use server'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import path from 'path'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { env } from 'process'
import { Photo } from '@/generated/prisma'
import { Readable } from 'stream'

const STORAGE_PROVIDER =
  process.env.NEXT_PUBLIC_STORAGE_PROVIDER === 'do_spaces'
    ? 'do_spaces'
    : 'local'
const BUCKET_NAME = env.DO_SPACES_BUCKET || ''

export const IMAGE_SIZES = {
  thumb: { width: 150, height: 150, quality: 80 },
  small: { width: 400, height: 400, quality: 85 },
  medium: { width: 800, height: 800, quality: 90 },
  large: { width: 1200, height: 1200, quality: 90 },
} as const

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

let s3Client: S3Client | null = null

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
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.DO_SPACES_KEY,
      secretAccessKey: env.DO_SPACES_SECRET,
    },
  })
}

export interface UploadedUrls {
  url: string
  url_thumb?: string
  url_small?: string
  url_medium?: string
  url_large?: string
}

export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string,
) {
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
  if (!file || file.size === 0) throw new Error('No file provided.')
  if (!ALLOWED_FORMATS.includes(file.type))
    throw new Error('Invalid file format.')

  const MAX_FILE_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE)
    throw new Error(
      `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    )

  const originalBuffer = Buffer.from(await file.arrayBuffer())
  const timestamp = Date.now()

  const originalExtension = file.type.split('/')[1]
  const originalFilename = `${entityId}.${timestamp}.original.${originalExtension}`
  const originalKey = `${prefix}/${originalFilename}`

  const sharp = (await import('sharp')).default
  const sharpInstance = sharp(originalBuffer).rotate()

  const processedImages = await Promise.all(
    Object.entries(IMAGE_SIZES).map(async ([size, config]) => {
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
      return { size: `url_${size}`, buffer: webpBuffer, filename: webpFilename }
    }),
  )

  const uploadPromises = [
    uploadToStorage(originalKey, originalBuffer, file.type),
    ...processedImages.map((img) =>
      uploadToStorage(`${prefix}/${img.filename}`, img.buffer, 'image/webp'),
    ),
  ]

  await Promise.all(uploadPromises)

  const uploadedUrls: UploadedUrls = { url: originalKey }
  processedImages.forEach((img) => {
    uploadedUrls[img.size as keyof UploadedUrls] = `${prefix}/${img.filename}`
  })

  if (STORAGE_PROVIDER === 'local') {
    for (const key in uploadedUrls) {
      const urlKey = key as keyof UploadedUrls
      if (uploadedUrls[urlKey])
        uploadedUrls[urlKey] = `uploads/${uploadedUrls[urlKey]}`
    }
  }

  return uploadedUrls
}

async function deleteFromStorage(storagePath: string): Promise<void> {
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
      const filepath = path.join(process.cwd(), 'public', storagePath)
      await unlink(filepath)
    } catch (e: unknown) {
      const error = e as { code?: string }
      if (error.code !== 'ENOENT')
        console.error(`Failed to delete local file: ${storagePath}`, error)
    }
  }
}

export async function getFileFromStorage(storagePath: string): Promise<Buffer> {
  if (STORAGE_PROVIDER === 'do_spaces' && s3Client) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
    })
    const response = await s3Client.send(command)
    const stream = response.Body as Readable
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
  } else {
    const { readFile } = await import('fs/promises')
    const filepath = path.join(process.cwd(), 'public', storagePath)
    return readFile(filepath)
  }
}

export async function deleteFile(photo: Photo): Promise<void> {
  const urlsToDelete: (string | null)[] = [
    photo.url,
    photo.url_thumb,
    photo.url_small,
    photo.url_medium,
    photo.url_large,
  ]
  const deletionPromises = urlsToDelete
    .filter((url): url is string => !!url)
    .map((url) => deleteFromStorage(url))
  await Promise.all(deletionPromises)
}
