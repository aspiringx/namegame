'use client'

import { useEffect, useState, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { useDeviceInfo } from '@/hooks/useDeviceInfo'
import { useSession } from 'next-auth/react'

export default function PullToRefresh() {
  const { data: session } = useSession()
  const deviceInfo = useDeviceInfo(session)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const isPulling = useRef(false)
  const threshold = 80 // Pixels to pull before triggering refresh

  useEffect(() => {
    // Only enable pull-to-refresh in PWA mode (iOS, Android, desktop PWAs)
    if (!deviceInfo.isReady || !deviceInfo.isPWA) return

    const handleTouchStart = (e: TouchEvent) => {
      // Don't trigger in chat interface (has its own scroll container)
      const target = e.target as HTMLElement
      if (
        target.closest('[data-messages-container]') ||
        target.closest('[data-chat-interface]')
      ) {
        return
      }

      // Only trigger if at top of page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      // Only pull down (positive distance) and limit to 150px
      if (distance > 0) {
        setPullDistance(Math.min(distance, 150))

        // Prevent default scroll if pulling more than 10px
        if (distance > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling.current || isRefreshing) return

      isPulling.current = false

      // Trigger refresh if pulled past threshold
      if (pullDistance > threshold) {
        setIsRefreshing(true)
        // Delay to show animation, then reload
        setTimeout(() => {
          window.location.reload()
        }, 300)
      } else {
        // Reset if not pulled far enough
        setPullDistance(0)
      }
    }

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [deviceInfo.isReady, deviceInfo.isPWA, pullDistance, isRefreshing])

  // Don't render anything if not in PWA mode or not pulling
  if (!deviceInfo.isPWA || (pullDistance === 0 && !isRefreshing)) {
    return null
  }

  const opacity = Math.min(pullDistance / threshold, 1)
  const rotation = (pullDistance / threshold) * 360

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex justify-center"
      style={{
        transform: `translateY(${Math.min(pullDistance - 50, 0)}px)`,
        opacity,
        transition: isPulling.current ? 'none' : 'all 0.3s ease-out',
      }}
    >
      <div className="mt-4 rounded-full bg-white p-3 shadow-lg bg-gray-800">
        <RefreshCw
          className={`h-6 w-6 text-gray-300 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
    </div>
  )
}
