// This file contains functions that are safe to run on the client.

// We can't use process.env here because it's not available on the client.
// The server-side logic will handle the actual storage provider switching.
// This client-side function just needs to know how to format the URL.
const STORAGE_PROVIDER = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'local';

export function getPublicUrl(storagePath: string | null | undefined): string {
  // 1. Handle the case where there is no image path.
  if (!storagePath) {
    return '/images/default-avatar.png';
  }

  // 2. Handle full external URLs.
  if (storagePath.startsWith('http')) {
    return storagePath;
  }

  // 3. Handle legacy local paths (stored in the public/uploads directory).
  if (storagePath.startsWith('uploads/')) {
    return `/${storagePath}`;
  }

  // 4. Handle new DigitalOcean Spaces paths by routing them through our secure proxy.
  if (STORAGE_PROVIDER === 'do_spaces') {
    return `/api/images?key=${storagePath}`;
  }

  // 5. Fallback for any other path, ensuring it's a valid root-relative URL.
  return `/${storagePath.replace(/^\/+/,'')}`;
}
