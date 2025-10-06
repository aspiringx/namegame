'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface ChatDeepLinkProps {
  onOpenChat: () => void
}

export default function ChatDeepLink({ onOpenChat }: ChatDeepLinkProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const openChat = searchParams.get('openChat')
    
    if (openChat === 'true') {
      // Open the chat drawer
      onOpenChat()
      
      // Clean up the URL by removing the query parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('openChat')
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [searchParams, router, onOpenChat])

  return null // This component doesn't render anything
}
