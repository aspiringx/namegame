'use server'

import { Photo } from '@/generated/prisma/client'
import {
  getFileFromStorage,
  IMAGE_SIZES,
  uploadToStorage,
} from '@/lib/actions/storage'
import { getPublicUrl } from './storage'
import prisma from './prisma'

type PublicPhoto = Photo & {
  url: string
  url_thumb: string
  url_small: string
  url_medium: string
  url_large: string
}

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

export async function getPublicPhoto(
  photo: Photo | null,
): Promise<PublicPhoto | null> {
  if (!photo) {
    return null
  }

  let processedPhoto = photo
  // If only the original URL exists, it's a legacy photo that needs processing.
  if (photo.url && !photo.url_thumb) {
    processedPhoto = await processLegacyPhoto(photo)
  }

  return {
    ...processedPhoto,
    url: await getPublicUrl(processedPhoto.url),
    url_thumb: await getPublicUrl(processedPhoto.url_thumb),
    url_small: await getPublicUrl(processedPhoto.url_small),
    url_medium: await getPublicUrl(processedPhoto.url_medium),
    url_large: await getPublicUrl(processedPhoto.url_large),
  }
}
