'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { RotateCcw } from 'lucide-react'
import type { Scene } from './types'
import SceneComponent from './Scene'
import { loadScript } from './utils/loadScript'
import { getSceneDuration } from './theatreConfig'

export default function StarField() {
  // Generate random seed once per session for star positions
  const [randomSeed] = useState(() => Math.floor(Math.random() * 1000000))

  // Scene management
  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentSceneIndex, setCurrentSceneIndex] = useState(1) // First scene is now index 1
  const [backgroundOpacity, setBackgroundOpacity] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(true)
  const [isFullyLoaded, setIsFullyLoaded] = useState(false)
  const currentScene = useMemo(
    () =>
      scenes[currentSceneIndex - 1] || {
        scene: 0,
        description: '',
        narration: 'Loading...',
        sceneType: '',
      },
    [scenes, currentSceneIndex],
  )

  // Load scene script once (no dependencies).
  useEffect(() => {
    loadScript().then((data) => {
      setScenes(data)
      // Wait a bit for Theatre.js and textures to initialize
      setTimeout(() => {
        setBackgroundOpacity(1)
        setIsFullyLoaded(true)
      }, 500)
    })
  }, [])

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
      {/* Loading overlay - stays visible until fully loaded */}
      {!isFullyLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500"></div>
            <p className="mt-4 text-sm text-gray-400">
              Loading your universe...
            </p>
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

      {isFullyLoaded && (
        <div
          id="nav-panel"
          className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4"
          style={{ bottom: '1rem' }}
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
                onClick={() => window.location.reload()}
                className="rounded border border-cyan-400/50 bg-cyan-500/10 p-1.5 text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                title="Restart"
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
