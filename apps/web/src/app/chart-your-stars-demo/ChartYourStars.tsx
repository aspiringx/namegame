'use client'

import { Suspense, useState } from 'react'
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
  const [modeSelected, setModeSelected] = useState(false)
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(false)

  const handleModeSelect = (isAutoPilot: boolean) => {
    setAutoPilotEnabled(isAutoPilot)
    setModeSelected(true)
  }

  // Show mode selection screen first
  if (!modeSelected) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-gray-900">
        <div className="flex h-full w-full items-center justify-center">
          <div className="mx-6 max-w-md text-center sm:mx-4">
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
              Chart Your Stars
            </h1>
            <p className="mb-8 text-gray-300">
              How would you like to explore this constellation?
            </p>

            <div className="flex flex-col gap-4">
              {/* Auto-Pilot Option */}
              <button
                onClick={() => handleModeSelect(true)}
                className="group rounded-2xl border-2 border-indigo-500 bg-indigo-600 p-6 text-center transition-all hover:scale-105 hover:border-indigo-400 hover:bg-indigo-700"
              >
                <div className="mb-3 text-5xl">🚀</div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  Auto-Pilot Mode
                </h3>
                <p className="text-sm text-indigo-100">
                  A cosmic guided tour that flies you from star to star with
                  narration.
                </p>
              </button>

              {/* Manual Option */}
              <button
                onClick={() => handleModeSelect(false)}
                className="group rounded-2xl border-2 border-white/20 bg-white/10 p-6 text-center transition-all hover:scale-105 hover:border-white/30 hover:bg-white/20"
              >
                <div className="mb-3 text-5xl">🧑‍🚀</div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  Manual Mode
                </h3>
                <p className="text-sm text-gray-300">
                  Navigate this constellation at your own pace with mouse and
                  touch controls.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-gray-900/90 to-transparent p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Chart Your Stars
            </h1>
            <p className="mt-1 text-sm text-gray-300 sm:text-base">
              Explore your universe
            </p>
          </div>

          {/* Auto-pilot toggle */}
          <button
            onClick={() => setAutoPilotEnabled(!autoPilotEnabled)}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-colors ${
              autoPilotEnabled
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {autoPilotEnabled ? '🚀 Auto-Pilot ON' : '🧑‍🚀 Manual Mode'}
          </button>
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
        <StarField 
          autoPilotEnabled={autoPilotEnabled}
          onModeChange={setAutoPilotEnabled}
        />
      </Suspense>
    </div>
  )
}
