'use client';

/**
 * Generates a public URL for a given storage path.
 * This is a client-side safe version of the function.
 * It assumes local storage and does not handle S3 signed URLs.
 */
export function getPublicUrl(storagePath: string | null | undefined): string {
  if (!storagePath) {
    return '/images/default-avatar.png';
  }

  // If it's already a full URL, return it as is.
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  // For local paths, ensure it starts with a leading slash.
  return `/${storagePath.replace(/^\/+/, '')}`;
}
