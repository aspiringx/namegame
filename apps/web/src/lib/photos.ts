'use server'

import { Photo } from '@namegame/db'
import { getFileFromStorage, uploadToStorage } from '@/lib/actions/storage'
import { IMAGE_SIZES } from '@/config/photos'
import { getPublicUrl } from './storage'
import prisma from './prisma'

const sizeOrder: (keyof typeof IMAGE_SIZES)[] = [
  'thumb',
  'small',
  'medium',
  'large',
]

async function processLegacyPhoto(photo: Photo): Promise<Photo> {
  // Do not process external URLs
  if (photo.url.startsWith('http')) {
    return photo
  }

  try {
    const originalBuffer = await getFileFromStorage(photo.url)
    const sharp = (await import('sharp')).default
    const sharpInstance = sharp(originalBuffer).rotate()

    const urlParts = photo.url.split('/')
    const subfolder = urlParts.slice(-2, -1)[0] // e.g., 'user-photos'
    const originalFilename = urlParts[urlParts.length - 1]
    const nameParts = originalFilename.split('.')
    const entityId = nameParts[0]
    const timestamp = nameParts[1]

    const newUrls: { [key: string]: string } = {}

    for (const [size, config] of Object.entries(IMAGE_SIZES)) {
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
      // The `uploadToStorage` function constructs the full path, so we only need
      // to provide the subfolder and the filename.
      const storageKey = `${subfolder}/${webpFilename}`
      await uploadToStorage(storageKey, webpBuffer, 'image/webp')
      newUrls[`url_${size}`] = `uploads/${subfolder}/${webpFilename}`
    }

    return prisma.photo.update({
      where: { id: photo.id },
      data: newUrls,
    })
  } catch (error) {
    console.error(`Failed to process legacy photo ${photo.id}:`, error)
    return photo // Return original photo if processing fails
  }
}

export async function getPhotoUrl(
  photo: Photo | null,
  options: {
    size?: 'thumb' | 'small' | 'medium' | 'large' | 'original'
    deviceType?: 'mobile' | 'desktop'
  } = {},
): Promise<string> {
  if (!photo) {
    return '/images/default-avatar.png'
  }

  let processedPhoto = photo
  // If the photo is local and hasn't been processed, process it now.
  if (photo.url && !photo.url.startsWith('http') && !photo.url_thumb) {
    processedPhoto = await processLegacyPhoto(photo)
  }

  // After processing, re-fetch the photo data to ensure we have the latest URLs
  if (processedPhoto !== photo) {
    const updatedPhoto = await prisma.photo.findUnique({
      where: { id: photo.id },
    })
    if (updatedPhoto) {
      processedPhoto = updatedPhoto
    }
  }

  // If the URL is external (like Dicebear), return it directly.
  if (processedPhoto.url.startsWith('http')) {
    return getPublicUrl(processedPhoto.url)
  }

  const { size, deviceType = 'mobile' } = options

  if (size === 'original') {
    return getPublicUrl(processedPhoto.url)
  }

  const preferredSize = size || (deviceType === 'mobile' ? 'small' : 'medium')

  const startIndex = sizeOrder.indexOf(preferredSize)

  // Find the best available size, starting from the preferred one.
  for (let i = startIndex; i < sizeOrder.length; i++) {
    const currentSize = sizeOrder[i]
    const urlKey = `url_${currentSize}` as keyof Photo
    const url = processedPhoto[urlKey] as string | null
    if (url) {
      return getPublicUrl(url)
    }
  }

  // If no pre-processed image is found, fall back to the original URL
  return getPublicUrl(processedPhoto.url)
}

