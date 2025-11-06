'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Scene } from './types'
import SceneComponent from './Scene'
import { loadScript } from './utils/loadScript'
import { getSceneDuration, getSceneSheet } from './theatreConfig'

export default function StarField() {
  // Scene management
  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentSceneIndex, setCurrentSceneIndex] = useState(1) // First scene is now index 1
  const [backgroundOpacity, setBackgroundOpacity] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(true)
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
      // Fade in background after scenes load
      setTimeout(() => setBackgroundOpacity(1), 100)
    })
  }, [])

  // Expose console helper for jumping to scenes
  useEffect(() => {
    if (typeof window !== 'undefined' && scenes.length > 0) {
      (window as any).goToScene = (sceneNumber: number) => {
        if (sceneNumber < 1 || sceneNumber > scenes.length) {
          console.error(`Scene ${sceneNumber} not found. Valid range: 1-${scenes.length}`)
          return
        }
        setCurrentSceneIndex(sceneNumber)
        console.log(`Jumped to Scene ${sceneNumber}`)
      }
      console.log(`💡 Test helper: goToScene(1-${scenes.length}) to jump to any scene`)
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

  // Navigate to previous scene
  const handleBack = useCallback(() => {
    if (currentSceneIndex > 1) {
      const prevIndex = currentSceneIndex - 1
      setCurrentSceneIndex(prevIndex)
      
      // Reset Theatre.js sequence to beginning of previous scene
      const sheet = getSceneSheet(prevIndex)
      if (sheet) {
        sheet.sequence.position = 0
      }
    }
  }, [currentSceneIndex])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
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
      >
        <SceneComponent currentScene={currentScene} />
      </Canvas>

      <div
        id="nav-panel"
        className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4"
        style={{ bottom: '1rem' }}
      >
        <div
          className={`relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl`}
        >
          {/* Control panel accent lines */}
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute left-0 bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-l from-indigo-500 via-cyan-400 to-indigo-500"></div>

          {/* Content */}
          <div className="relative px-4 py-3 sm:px-6 sm:py-4 transition-all duration-300 ease-in-out">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400/70">
                Navigation System
              </span>
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

            <div className="mt-3 flex gap-2">
              {/* Back button - only show if not on first scene */}
              {currentSceneIndex > 1 && (
                <button
                  onClick={handleBack}
                  className="rounded border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 font-mono text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                  title="Previous scene"
                >
                  ←
                </button>
              )}
              {/* Proceed button */}
              <button
                onClick={handleNext}
                disabled={!animationComplete || currentSceneIndex >= scenes.length}
                className={`flex-1 rounded border px-4 py-2 font-mono text-sm font-medium transition-colors ${
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
    </div>
  )
}
