'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from './button'
import { useState } from 'react'
import { useDeviceInfo } from '@/hooks/useDeviceInfo'
import { useSession } from 'next-auth/react'

interface RefreshButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function RefreshButton({ 
  variant = 'ghost', 
  size = 'icon',
  className = ''
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: session } = useSession()
  const deviceInfo = useDeviceInfo(session)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Hard refresh the page
    window.location.reload()
  }

  // Wait for device info to be ready and only show in PWA mode
  if (!deviceInfo.isReady || !deviceInfo.isPWA) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className}
      aria-label="Refresh page"
    >
      <RefreshCw 
        className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
    </Button>
  )
}
