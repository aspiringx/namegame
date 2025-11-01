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
  const [isPlaying, setIsPlaying] = useState(false)
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
    loadScript().then((data) => setScenes(data))
  }, [])



  useEffect(() => {
    if (!currentScene) return

    setIsPlaying(true)
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

    const timer = setTimeout(
      () => setIsPlaying(false),
      currentScene.animationDuration || 5000,
    )
    return () => clearTimeout(timer)
  }, [currentScene])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        style={{ width: '100%', height: '100dvh', background: '#00000a' }}
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
        <div className="relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute left-0 bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-l from-indigo-500 via-cyan-400 to-indigo-500"></div>

          <div className="p-4">
            <p className="text-white mb-4">{currentScene.narration}</p>
            <button
              onClick={() => {
                setCurrentSceneIndex((prev) =>
                  Math.min(prev + 1, scenes.length),
                )
                setIsPlaying(false)
              }}
              disabled={isPlaying}
              className="bg-indigo-600 px-4 py-2 rounded-lg text-white disabled:opacity-50"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
