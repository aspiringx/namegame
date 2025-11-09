'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { RotateCcw } from 'lucide-react'
import type { Scene } from './types'
import SceneComponent from './Scene'
import { loadScript } from './utils/loadScript'
import { getSceneDuration, theatreProject, sheets } from './theatreConfig'

const SCENE_PROGRESS_KEY = 'speed-of-love-scene-progress'
const HAS_LOADED_KEY = 'speed-of-love-has-loaded'

export default function StarField() {
  // Generate random seed once per session for star positions
  const [randomSeed] = useState(() => Math.floor(Math.random() * 1000000))

  // Track if this is the first time loading (for full loading screen)
  const hasLoadedBefore = useRef<boolean>(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Scene management with sessionStorage persistence
  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentSceneIndex, setCurrentSceneIndex] = useState(() => {
    // Restore scene progress from sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SCENE_PROGRESS_KEY)
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 1) {
          return parsed
        }
      }
    }
    return 1 // Default to first scene
  })
  const [backgroundOpacity, setBackgroundOpacity] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(true)
  const [isFullyLoaded, setIsFullyLoaded] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true)
  const [showNavPanel, setShowNavPanel] = useState(false)
  const [showHeader, setShowHeader] = useState(false)
  const currentScene = useMemo(
    () =>
      scenes[currentSceneIndex - 1] || {
        scene: 0,
        description: '',
        narration: isInitialLoad ? 'Loading your universe...' : 'Reconnecting...',
        sceneType: '',
      },
    [scenes, currentSceneIndex, isInitialLoad],
  )

  // Save scene progress to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentSceneIndex > 0) {
      sessionStorage.setItem(SCENE_PROGRESS_KEY, currentSceneIndex.toString())
    }
  }, [currentSceneIndex])

  // Check if user has loaded before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasLoaded = sessionStorage.getItem(HAS_LOADED_KEY)
      if (hasLoaded === 'true') {
        hasLoadedBefore.current = true
        setIsInitialLoad(false)
      }
    }
  }, [])

  // Load scene script and wait for Theatre.js to be fully ready
  useEffect(() => {
    let mounted = true
    let hasInitialized = false

    const initialize = async () => {
      // Prevent double initialization
      if (hasInitialized) return
      hasInitialized = true

      try {
        // Show reconnecting indicator if this is not initial load
        if (!isInitialLoad && scenes.length === 0) {
          setIsReconnecting(true)
        }

        // Load scene data
        const data = await loadScript()
        if (!mounted) return
        setScenes(data)

        // Wait for Theatre.js project to be ready
        await theatreProject.ready

        // Wait for all scene sheets to be initialized (with timeout)
        const waitForSheets = new Promise<void>((resolve) => {
          const checkSheets = () => {
            // Check if all scene sheets exist
            const allSheetsReady = data.every((scene) => sheets.has(scene.scene))
            if (allSheetsReady) {
              resolve()
            } else {
              // Check again in 100ms
              setTimeout(checkSheets, 100)
            }
          }
          checkSheets()

          // Timeout after 10 seconds
          setTimeout(() => resolve(), 10000)
        })

        await waitForSheets

        if (!mounted) return

        // Mark as loaded
        setBackgroundOpacity(1)
        setIsFullyLoaded(true)
        setIsReconnecting(false)

        // Fade out loading overlay, then remove it
        setTimeout(() => {
          setShowLoadingOverlay(false)
        }, 500) // Wait for fade animation to complete

        // Show header immediately after loading overlay fades
        setTimeout(() => {
          setShowHeader(true)
        }, 500)

        // Show nav panel after stars have fully faded in
        // Stars fade in over 10 frames at 30fps = ~333ms
        // Wait for stars to be fully visible before showing nav panel
        setTimeout(() => {
          setShowNavPanel(true)
        }, 1200) // 500ms loading fade + 333ms star fade + 367ms buffer

        // Mark that user has loaded before
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(HAS_LOADED_KEY, 'true')
        }
      } catch (error) {
        console.error('Failed to initialize Speed of Love:', error)
        // Still mark as loaded to prevent infinite loading state
        if (mounted) {
          setIsFullyLoaded(true)
          setIsReconnecting(false)
          // Fade out loading overlay even on error
          setTimeout(() => {
            setShowLoadingOverlay(false)
          }, 500)
          // Show UI elements even on error
          setTimeout(() => {
            setShowHeader(true)
          }, 500)
          setTimeout(() => {
            setShowNavPanel(true)
          }, 1200)
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally empty - we only want to initialize once on mount

  // Expose console helper for jumping to scenes
  useEffect(() => {
    if (typeof window !== 'undefined' && scenes.length > 0) {
      ;(window as any).goToScene = (sceneNumber: number) => {
        if (sceneNumber < 1 || sceneNumber > scenes.length) {
          console.error(
            `Scene ${sceneNumber} not found. Valid range: 1-${scenes.length}`,
          )
          return
        }
        setCurrentSceneIndex(sceneNumber)
        console.log(`Jumped to Scene ${sceneNumber}`)
      }
      console.log(
        `💡 Test helper: goToScene(1-${scenes.length}) to jump to any scene`,
      )
    }
  }, [scenes])

  useEffect(() => {
    if (!currentScene) return

    // Mark animation as incomplete when scene starts
    setAnimationComplete(false)

    // Get Theatre.js duration (in seconds) and convert to milliseconds
    const durationMs = (getSceneDuration(currentScene.scene) || 0) * 1000

    // Set animation complete after scene duration
    const timer = setTimeout(() => {
      setAnimationComplete(true)
    }, durationMs)

    return () => {
      clearTimeout(timer)
    }
  }, [currentScene, currentSceneIndex])

  // Navigate to next scene
  const handleNext = useCallback(() => {
    if (currentSceneIndex < scenes.length) {
      setCurrentSceneIndex((prev) => prev + 1)
    }
  }, [currentSceneIndex, scenes.length])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      {/* Full loading overlay - only on initial load */}
      {showLoadingOverlay && isInitialLoad && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900"
          style={{
            opacity: isFullyLoaded ? 0 : 1,
            transition: 'opacity 400ms ease-out',
            pointerEvents: isFullyLoaded ? 'none' : 'auto'
          }}
        >
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500"></div>
            <p className="mt-4 text-sm text-gray-400">
              Loading your universe...
            </p>
          </div>
        </div>
      )}

      {/* Subtle reconnecting indicator - for mid-experience issues */}
      {isReconnecting && !isInitialLoad && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-indigo-500/50 bg-slate-900/90 px-4 py-2 backdrop-blur-sm">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500"></div>
          <p className="text-xs text-gray-300">Reconnecting...</p>
        </div>
      )}

      {/* Header - fade in after loading completes */}
      {showHeader && (
        <div 
          className="absolute left-0 right-0 top-0 z-10 p-4 sm:p-6"
          style={{
            animation: 'fadeIn 0.6s ease-out'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-xl">
                Your Universe
              </h1>
              <p className="mt-1 text-sm text-gray-300 sm:text-base">
                {/* At the speed of love */}
              </p>
            </div>

            {/* Auto-pilot status indicator (non-interactive) */}
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-indigo-400/60">🚀</span>
              <span className="text-indigo-400/60 uppercase tracking-wider text-xs">
                Auto-Pilot
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-in-out;
        }
      `}</style>
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        style={{
          width: '100%',
          height: '100dvh',
          background: '#00000a',
          opacity: backgroundOpacity,
          transition: 'opacity 800ms ease-in-out',
        }}
        gl={{
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          // Handle context loss/restore
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            console.log('WebGL context lost')
          })
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored')
          })
        }}
      >
        <SceneComponent currentScene={currentScene} randomSeed={randomSeed} />
      </Canvas>

      {showNavPanel && (
        <div
          id="nav-panel"
          className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4"
          style={{ 
            bottom: '1rem',
            animation: 'fadeIn 1s ease-out'
          }}
        >
        <div
          className={`relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900/50 to-slate-950/50 shadow-2xl backdrop-blur-sm`}
        >
          {/* Control panel accent lines */}
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute left-0 bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-l from-indigo-500 via-cyan-400 to-indigo-500"></div>

          {/* Content */}
          <div className="relative px-4 py-3 sm:px-6 sm:py-4 transition-all duration-300 ease-in-out">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400/70">
                  Navigation System
                </span>
              </div>
              <button
                onClick={() => {
                  // Clear session storage to restart from beginning
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem(SCENE_PROGRESS_KEY)
                    sessionStorage.removeItem(HAS_LOADED_KEY)
                  }
                  window.location.reload()
                }}
                className="rounded border border-cyan-400/50 bg-cyan-500/10 p-1.5 text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                title="Restart from beginning"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="relative min-h-[3rem] transition-all duration-300 ease-in-out">
              <p
                key={currentScene.scene}
                className="font-mono text-xs leading-relaxed tracking-wide text-indigo-100 sm:text-sm pt-2 animate-fade-in"
                style={{ letterSpacing: '0.03em' }}
              >
                {currentScene.narration}
              </p>
            </div>

            <div className="mt-3">
              {/* Proceed button */}
              <button
                onClick={handleNext}
                disabled={
                  !animationComplete || currentSceneIndex >= scenes.length
                }
                className={`w-full rounded border px-4 py-2 font-mono text-sm font-medium transition-colors ${
                  animationComplete && currentSceneIndex < scenes.length
                    ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 cursor-pointer'
                    : 'border-cyan-400/20 bg-cyan-500/5 text-cyan-400/40 cursor-not-allowed'
                }`}
              >
                → Proceed
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
