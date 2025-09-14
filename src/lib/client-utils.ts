'use client'

export function cacheImages(imageUrls: string[]) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const filteredUrls = imageUrls.filter(
      (url) => url.includes('.thumb.webp') || url.includes('.small.webp'),
    )

    if (filteredUrls.length > 0) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_IMAGES',
        payload: { imageUrls: filteredUrls },
      })
    }
  }
}
