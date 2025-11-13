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

export default function SpeedOfLove() {
  // Mode selection screen removed - always auto-pilot

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
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
