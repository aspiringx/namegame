'use client'

import Image, { ImageProps } from 'next/image'
import { useEffect } from 'react'
import { cacheImages } from '@/lib/client-utils'

interface CacheableImageProps extends ImageProps {
  src: string
}

export function CacheableImage({ src, alt, ...props }: CacheableImageProps) {
  useEffect(() => {
    if (src) {
      cacheImages([src])
    }
  }, [src])

  return <Image src={src} alt={alt} {...props} />
}
