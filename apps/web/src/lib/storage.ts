const STORAGE_PROVIDER = process.env.NEXT_PUBLIC_STORAGE_PROVIDER

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
  if (STORAGE_PROVIDER === 'local') {
    return `/${storagePath.replace(/^\/?uploads\//, 'uploads/')}`
  }

  // 4. If it's already a proxied path, return it as is.
  if (storagePath.startsWith('/api/images')) {
    return storagePath
  }

  // 5. For all other cases (assumed to be S3 keys), route them through the proxy.
  const key = storagePath.replace(/^uploads\//, '')
  return `/api/images?key=${key}`
}
