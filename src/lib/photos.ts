'use server'

import { Photo } from '@/generated/prisma/client'
import {
  getFileFromStorage,
  IMAGE_SIZES,
  uploadToStorage,
} from '@/lib/actions/storage'
import { getPublicUrl } from './storage'
import prisma from './prisma'

const sizeOrder: (keyof typeof IMAGE_SIZES)[] = ['thumb', 'small', 'medium', 'large']

/**
 * A robust helper function to get the public URL for a photo, with intelligent
 * fallback logic and background processing for legacy images.
 *
 * @param photo The photo object from the database.
 * @param preferredSize The desired image size to retrieve.
 * @returns A promise that resolves to the public URL of the image.
 */
export async function getPhotoUrl(
  photo: Photo | null,
  preferredSize: 'thumb' | 'small' | 'medium' | 'large' | 'original' = 'original',
): Promise<string> {
  if (!photo) {
    return '/images/default-avatar.png'
  }

  // If the preferred size is original, just return the main URL.
  if (preferredSize === 'original') {
    return getPublicUrl(photo.url)
  }

  const urlKey = `url_${preferredSize}` as keyof Photo
  const preferredUrl = photo[urlKey] as string | null

  // If the preferred size exists, return it.
  if (preferredUrl) {
    return getPublicUrl(preferredUrl)
  }

  // If only the original URL exists, it's a legacy photo that needs processing.
  if (photo.url && !photo.url_thumb) {
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

      await prisma.photo.update({
        where: { id: photo.id },
        data: newUrls,
      })

      // Return the originally requested size now that it's been created.
      const newlyCreatedUrl = newUrls[urlKey]
      if (newlyCreatedUrl) {
        return getPublicUrl(newlyCreatedUrl)
      }
    } catch (error) {
      console.error(`Failed to process legacy photo ${photo.id}:`, error)
      // Fallback to original URL if processing fails.
      return getPublicUrl(photo.url)
    }
  }

  // Fallback for non-legacy photos: find the best available size.
  const startIndex = sizeOrder.indexOf(preferredSize)
  for (let i = startIndex; i < sizeOrder.length; i++) {
    const size = sizeOrder[i]
    const fallbackUrlKey = `url_${size}` as keyof Photo
    const fallbackUrl = photo[fallbackUrlKey] as string | null
    if (fallbackUrl) {
      return getPublicUrl(fallbackUrl)
    }
  }

  // Final fallback to the original URL.
  return getPublicUrl(photo.url)
}
