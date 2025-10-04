'use server'

import prisma from '@/lib/prisma'
import { getPhotoUrl } from '@/lib/photos'
import { getCodeTable } from '@/lib/codes'

export async function getGroupMemberPhotos(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>()
  }

  const entityTypes = await getCodeTable('entityType')
  const photoTypes = await getCodeTable('photoType')

  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photoMap = new Map<string, string>()
  
  await Promise.all(
    photos.map(async (photo) => {
      const photoUrl = await getPhotoUrl(photo, { size: 'thumb' })
      if (photoUrl) {
        photoMap.set(photo.entityId, photoUrl)
      }
    })
  )

  return photoMap
}
