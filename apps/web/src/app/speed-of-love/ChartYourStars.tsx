'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the 3D scene to avoid SSR issues with Three.js
const StarField = dynamic(() => import('./StarField'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500"></div>
        <p className="mt-4 text-sm text-gray-400">Loading your universe...</p>
      </div>
    </div>
  ),
})

export default function ChartYourStars() {
  // Mode selection screen removed - always auto-pilot

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-gray-900/90 to-transparent p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Your Universe
            </h1>
            <p className="mt-1 text-sm text-gray-300 sm:text-base">
              At the speed of love
            </p>
          </div>

          {/* Auto-pilot status indicator (non-interactive) */}
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-indigo-400/60">🚀</span>
            <span className="text-indigo-400/60 uppercase tracking-wider text-xs">Auto-Pilot</span>
          </div>
        </div>
      </div>

      {/* 3D Scene */}
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500"></div>
              <p className="mt-4 text-sm text-gray-400">
                Loading your universe...
              </p>
            </div>
          </div>
        }
      >
        <StarField />
      </Suspense>
    </div>
  )
}
