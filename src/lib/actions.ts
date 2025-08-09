'use server'

import { getPublicUrl } from './storage'

export async function getSecureImageUrl(storagePath: string | null | undefined) {
  if (!storagePath) {
    return '/images/default-avatar.png'
  }
  return getPublicUrl(storagePath)
}
