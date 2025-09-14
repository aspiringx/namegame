'use server'

import { Photo } from '@/generated/prisma/client'
import {
  getFileFromStorage,
  uploadToStorage,
} from '@/lib/actions/storage'
import { IMAGE_SIZES } from '@/config/photos'
import { getPublicUrl } from './storage'
import prisma from './prisma'

const sizeOrder: (keyof typeof IMAGE_SIZES)[] = ['thumb', 'small', 'medium', 'large']

async function processLegacyPhoto(photo: Photo): Promise<Photo> {
  try {
    console.log(`Processing legacy photo: ${photo.id}`)
    const originalBuffer = await getFileFromStorage(photo.url)
    const sharp = (await import('sharp')).default
    const sharpInstance = sharp(originalBuffer).rotate()

    const urlParts = photo.url.split('/')
    const prefix = urlParts.slice(0, -1).join('/')
    const originalFilename = urlParts[urlParts.length - 1]
    const nameParts = originalFilename.split('.')
    const entityId = nameParts[0]
    const timestamp = nameParts[1]

    const newUrls: { [key: string]: string } = {}

    const processingPromises = Object.entries(IMAGE_SIZES).map(
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
        const storageKey = `${prefix}/${webpFilename}`
        await uploadToStorage(storageKey, webpBuffer, 'image/webp')
        newUrls[`url_${size}`] = storageKey
      },
    )

    await Promise.all(processingPromises)

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
  preferredSize: 'thumb' | 'small' | 'medium' | 'large' | 'original' = 'original',
): Promise<string> {
  if (!photo) {
    return '/images/default-avatar.png'
  }

  let processedPhoto = photo
  if (photo.url && !photo.url_thumb) {
    processedPhoto = await processLegacyPhoto(photo)
  }

  if (preferredSize === 'original') {
    return getPublicUrl(processedPhoto.url)
  }

  const startIndex = sizeOrder.indexOf(preferredSize)
  for (let i = startIndex; i < sizeOrder.length; i++) {
    const size = sizeOrder[i]
    const urlKey = `url_${size}` as keyof Photo
    const url = processedPhoto[urlKey] as string | null
    if (url) {
      return getPublicUrl(url)
    }
  }

  // Final fallback to the original URL if no other sizes are found
  return getPublicUrl(processedPhoto.url)
}
