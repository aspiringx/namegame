import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AnimationCommand, Scene as SceneData } from './types'
import { PerspectiveCamera } from '@react-three/drei'
import BackgroundStars from './BackgroundStars'
import PrimaryStars from './PrimaryStars'

// The new, simplified props for the scene
interface SceneProps {
  activeAnimations?: AnimationCommand[]
  currentScene: SceneData
}

export default function Scene({ activeAnimations, currentScene }: SceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  // The animation loop is now clean and simple.
  // It only executes the commands passed down from StarField.
  useFrame(() => {
    if (!cameraRef.current || !activeAnimations?.length) return

    const camera = cameraRef.current

    activeAnimations.forEach((anim) => {
      switch (anim.type) {
        case 'moveCamera':
          if (anim.params.position) {
            camera.position.lerp(
              new THREE.Vector3(...anim.params.position),
              0.05,
            )
          }
          if (anim.params.fov !== undefined) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, anim.params.fov, 0.05)
            camera.updateProjectionMatrix()
          }
          break
        // Future animation handlers will be added here.
      }
    })
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={1} />

      {/* Conditionally render stars based on the sceneType from the JSON script */}
      {currentScene.sceneType === 'cosmicView' &&
        (() => {
          return true
        })() && (
          <>
            <BackgroundStars
              radius={currentScene.backgroundStars?.radius || 500}
              count={currentScene.backgroundStars?.count || 2000}
              colors={
                currentScene.backgroundStars?.colors || [0x0a1128, 0x1a2a3a]
              }
              size={currentScene.backgroundStars?.size || 1.5}
              opacity={currentScene.backgroundStars?.opacity || 0.8}
            />
            {/* The primary stars for the cosmic view - no scaling wrapper */}
            <PrimaryStars
              radius={currentScene.primaryStars?.radius || 100}
              count={currentScene.primaryStars?.count || 15}
              size={8.0}
              opacity={1.0}
            />
          </>
        )}

      {/* Note: The data-driven <Star> components and <ConstellationLines>
          are no longer rendered by default. They will be added back
          conditionally as we implement the scenes that require them. */}

      <PerspectiveCamera
        makeDefault
        ref={cameraRef}
        position={currentScene.cameraPosition || [0, 0, 150]}
        fov={currentScene.cameraFOV || 60}
        near={0.1}
        far={2000}
      />
    </>
  )
}
