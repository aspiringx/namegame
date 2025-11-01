'use client'

import { useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Scene } from './types'
import { AnimationCommand } from './types'
import SceneComponent from './Scene'
import { loadScript } from './utils/loadScript'

export default function StarField() {
  // Scene management
  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentSceneIndex, setCurrentSceneIndex] = useState(1) // First scene is now index 1
  const [backgroundOpacity, setBackgroundOpacity] = useState(0)
  const [pulseNavPanel, setPulseNavPanel] = useState(false)
  const currentScene = useMemo(
    () =>
      scenes[currentSceneIndex - 1] || {
        narration: 'Loading...',
        sceneType: '',
        animationDuration: 0,
      },
    [scenes, currentSceneIndex],
  )

  const [activeAnimations, setActiveAnimations] = useState<AnimationCommand[]>(
    [],
  )

  // Load script
  useEffect(() => {
    loadScript().then((data) => {
      setScenes(data)
      // Fade in background after scenes load
      setTimeout(() => setBackgroundOpacity(1), 100)
    })
  }, [])

  useEffect(() => {
    if (!currentScene) return

    const commands: AnimationCommand[] = []

    if (currentScene.cameraPosition && currentScene.cameraFOV) {
      commands.push({
        type: 'moveCamera',
        params: {
          position: currentScene.cameraPosition,
          fov: currentScene.cameraFOV,
        },
      } as const)
    }

    // Add other effect commands based on scene properties
    setActiveAnimations(commands)

    // Trigger nav-panel pulse on scene change
    // Add 1.5s delay on first scene so user notices stars first
    const isFirstScene = currentSceneIndex === 1
    const pulseDelay = isFirstScene ? 1500 : 0
    
    const startPulseTimer = setTimeout(() => {
      setPulseNavPanel(true)
      const endPulseTimer = setTimeout(() => setPulseNavPanel(false), 2000)
      return () => clearTimeout(endPulseTimer)
    }, pulseDelay)
    
    return () => clearTimeout(startPulseTimer)
  }, [currentScene, currentSceneIndex])

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
        @keyframes pulse-glow {
          0% {
            box-shadow: 0 0 5px rgba(34, 211, 238, 0.4), 0 0 10px rgba(34, 211, 238, 0.2);
          }
          50% {
            box-shadow: 0 0 8px rgba(34, 211, 238, 0.6), 0 0 15px rgba(34, 211, 238, 0.3);
          }
          100% {
            box-shadow: 0 0 5px rgba(34, 211, 238, 0.4), 0 0 10px rgba(34, 211, 238, 0.2);
          }
        }
        .pulse-glow {
          animation: pulse-glow 1.2s cubic-bezier(0.4, 0, 0.2, 1);
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
        <SceneComponent
          currentScene={currentScene}
          activeAnimations={activeAnimations}
        />
      </Canvas>

      <div
        id="nav-panel"
        className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4"
        style={{ bottom: '1rem' }}
      >
        <div className={`relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl ${pulseNavPanel ? 'pulse-glow' : ''}`}>
          {/* Control panel accent lines */}
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute left-0 bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-l from-indigo-500 via-cyan-400 to-indigo-500"></div>

          {/* Content */}
          <div className="relative px-4 py-3 sm:px-6 sm:py-4 transition-all duration-300 ease-in-out">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
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

            <div className="mt-3">
              <button
                onClick={() => {
                  setCurrentSceneIndex((prev) =>
                    Math.min(prev + 1, scenes.length),
                  )
                }}
                className="w-full rounded border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 font-mono text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
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
