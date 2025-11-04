import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AnimationCommand, Scene as SceneData } from './types'
import { PerspectiveCamera } from '@react-three/drei'
import BackgroundStars from './BackgroundStars'
import PrimaryStars from './PrimaryStars'
import HeroStar from './HeroStar'
import HeroConstellationLines from './HeroConstellationLines'
// Import Theatre.js configuration and utilities
import {
  theatreProject,
  initializeTheatreFromConfig,
  getSceneAnimation,
  getSceneSheet,
  getSceneDuration,
} from './theatreConfig'

// Initialize Theatre.js Studio in development mode only
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@theatre/studio').then(({ default: studio }) => {
    studio.initialize()

    // Add export button to window for easy access
    ;(window as any).exportTheatreState = () => {
      const state = studio.createContentOfSaveFile('Speed of Love')
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'speed-of-love-theatre-state.json'
      a.click()
      console.log('Theatre.js state exported!')
    }
    console.log('💡 To export Theatre.js state, run: exportTheatreState()')
  })
}

// Load Theatre.js state and initialize sheets/objects from config
theatreProject.ready.then(() => {
  // @ts-ignore - Theatre.js types don't include this method
  if (theatreProject.isReady) return
  // @ts-ignore
  theatreProject.sheet('__temp').sequence.play() // Trigger state load
})

// Initialize Theatre.js objects from animation config
initializeTheatreFromConfig()

// The new, simplified props for the scene
interface SceneProps {
  activeAnimations?: AnimationCommand[]
  currentScene: SceneData
}

export default function Scene({ activeAnimations, currentScene }: SceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  // State to hold Theatre.js animated values
  const [theatreStarsOpacity, setTheatreStarsOpacity] = useState(0)
  const [theatreHeroStarOpacity, setTheatreHeroStarOpacity] = useState(0)
  const [theatreHeroStarScale, setTheatreHeroStarScale] = useState(0)
  const [theatreScene2PrimaryStarsOpacity, setTheatreScene2PrimaryStarsOpacity] =
    useState(1.0)
  const [theatrePrimaryStarsOpacity, setTheatrePrimaryStarsOpacity] =
    useState(0.3)
  const [theatreConstellationOpacity, setTheatreConstellationOpacity] =
    useState(0)

  // Scene 4: Theatre.js animated values
  const [theatreOldConstellationOpacity, setTheatreOldConstellationOpacity] =
    useState(1.0)
  const [theatreOldPrimaryStarsOpacity, setTheatreOldPrimaryStarsOpacity] =
    useState(1.0)
  const [theatreCameraX, setTheatreCameraX] = useState(0)
  const [theatreCameraY, setTheatreCameraY] = useState(0)
  const [theatreCameraZ, setTheatreCameraZ] = useState(150)
  const [theatreHeroStarX, setTheatreHeroStarX] = useState(0)
  const [theatreHeroStarY, setTheatreHeroStarY] = useState(0)
  const [theatreHeroStarZ, setTheatreHeroStarZ] = useState(0)
  const [theatreNewPrimaryStarsOpacity, setTheatreNewPrimaryStarsOpacity] =
    useState(0)
  const [theatreNewConstellationOpacity, setTheatreNewConstellationOpacity] =
    useState(0)

  const [primaryStarPositions, setPrimaryStarPositions] =
    useState<Float32Array | null>(null)
  const newPrimaryStarPositionsRef = useRef<Float32Array | null>(null) // Immediate access, no React delay
  const [twinklingEnabled, setTwinklingEnabled] = useState(false)
  const heroStarGroupRef = useRef<THREE.Group>(null)

  // Theatre.js: Auto-play animations when scenes load
  useEffect(() => {
    const sheet = getSceneSheet(currentScene.scene)
    const duration = getSceneDuration(currentScene.scene)

    if (!sheet || !duration) return

    // Wait for Theatre.js project to load before playing
    theatreProject.ready.then(() => {
      sheet.sequence.play({ range: [0, duration] })
    })

    // Cleanup: pause sequence when scene changes
    return () => {
      sheet.sequence.pause()
    }
  }, [currentScene.scene])

  // Enable twinkling in Scene 3
  useEffect(() => {
    if (currentScene.sceneType === 'constellationForm') {
      setTwinklingEnabled(true)
    }
  }, [currentScene.sceneType])

  // Theatre.js: Read animated values every frame and update React state
  useFrame(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return

    // Scene 1: Read stars opacity
    if (currentScene.scene === 1) {
      setTheatreStarsOpacity(animation.value.starsOpacity)
    }

    // Scene 2: Read hero star opacity, scale, and primary stars opacity
    if (currentScene.scene === 2) {
      setTheatreHeroStarOpacity(animation.value.heroStarOpacity)
      setTheatreHeroStarScale(animation.value.heroStarScale)
      setTheatreScene2PrimaryStarsOpacity(animation.value.primaryStarsOpacity)
    }

    // Scene 3: Read primary stars and constellation opacity
    if (currentScene.scene === 3) {
      setTheatrePrimaryStarsOpacity(animation.value.primaryStarsOpacity)
      setTheatreConstellationOpacity(animation.value.constellationOpacity)
    }

    // Scene 4: Read all orbit change animation values
    if (currentScene.scene === 4) {
      setTheatreOldConstellationOpacity(animation.value.oldConstellationOpacity)
      setTheatreOldPrimaryStarsOpacity(animation.value.oldPrimaryStarsOpacity)
      setTheatreCameraX(animation.value.cameraX)
      setTheatreCameraY(animation.value.cameraY)
      setTheatreCameraZ(animation.value.cameraZ)
      setTheatreHeroStarX(animation.value.heroStarX)
      setTheatreHeroStarY(animation.value.heroStarY)
      setTheatreHeroStarZ(animation.value.heroStarZ)
      setTheatreNewPrimaryStarsOpacity(animation.value.newPrimaryStarsOpacity)
      setTheatreNewConstellationOpacity(animation.value.newConstellationOpacity)
    }
  })

  // Scene 4: Apply Theatre.js camera and hero star positions
  useFrame(() => {
    if (currentScene.scene === 4 && cameraRef.current) {
      // Apply Theatre.js camera position directly (3D movement)
      cameraRef.current.position.x = theatreCameraX
      cameraRef.current.position.y = theatreCameraY
      cameraRef.current.position.z = theatreCameraZ

      // Update hero star group position to match Theatre.js value (3D movement)
      if (heroStarGroupRef.current) {
        heroStarGroupRef.current.position.x = theatreHeroStarX
        heroStarGroupRef.current.position.y = theatreHeroStarY
        heroStarGroupRef.current.position.z = theatreHeroStarZ
      }
    }
  })

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

      {/* Background stars - All scenes use Theatre.js or static values */}
      <BackgroundStars
        key="background-stars"
        radius={currentScene.backgroundStars?.radius || 400}
        count={currentScene.backgroundStars?.count || 2000}
        size={currentScene.backgroundStars?.baseSize || 3.0}
        opacity={
          currentScene.scene === 1
            ? 0.8 * theatreStarsOpacity
            : currentScene.scene === 2
            ? 0.8 * theatreScene2PrimaryStarsOpacity
            : 0.8
        }
        enableTwinkling={twinklingEnabled}
      />

      {/* Scene 1: Stars controlled by Theatre.js */}
      {currentScene.scene === 1 && (
        <PrimaryStars
          key="primary-stars-1"
          radius={currentScene.primaryStars?.radius || 100}
          count={currentScene.primaryStars?.count || 15}
          size={currentScene.primaryStars?.baseSize || 12.0}
          opacity={theatreStarsOpacity}
          onPositionsReady={setPrimaryStarPositions}
        />
      )}

      {/* Scene 2: Primary stars controlled by Theatre.js */}
      {currentScene.scene === 2 && (
        <PrimaryStars
          key="primary-stars-1"
          radius={currentScene.primaryStars?.radius || 100}
          count={currentScene.primaryStars?.count || 15}
          size={currentScene.primaryStars?.baseSize || 12.0}
          opacity={theatreScene2PrimaryStarsOpacity}
          onPositionsReady={setPrimaryStarPositions}
        />
      )}

      {/* Scene 3: Primary stars controlled by Theatre.js */}
      {currentScene.scene === 3 && (
        <PrimaryStars
          key="primary-stars-1"
          radius={currentScene.primaryStars?.radius || 100}
          count={currentScene.primaryStars?.count || 15}
          size={currentScene.primaryStars?.baseSize || 12.0}
          opacity={theatrePrimaryStarsOpacity}
          onPositionsReady={setPrimaryStarPositions}
        />
      )}

      {/* Scene 3: Constellation forms around hero star */}
      {currentScene.scene === 3 && (
        <>
          {/* Constellation lines connecting to hero at origin */}
          {primaryStarPositions && (
            <HeroConstellationLines
              heroPosition={[0, 0, 0]}
              starPositions={primaryStarPositions}
              color={currentScene.connectionLines?.color || '#22d3ee'}
              opacity={theatreConstellationOpacity}
              fadeInDuration={0} // Theatre.js controls the fade
            />
          )}
        </>
      )}

      {/* Scene 2, 3, 4: Keep hero star visible */}
      {/* Hero star - moves with camera in Scene 4 to stay centered */}
      {currentScene.scene > 1 && currentScene.scene < 5 && (
        <group ref={heroStarGroupRef}>
          <HeroStar
            brightness={currentScene.heroStar?.brightness || 1.5}
            opacity={
              currentScene.scene === 2
                ? theatreHeroStarOpacity
                : 1.0 // Stay at full opacity in Scene 3 and 4
            }
            scale={
              currentScene.scene === 2
                ? theatreHeroStarScale
                : 1.0 // Stay at full scale in Scene 3 and 4
            }
          />
        </group>
      )}

      {/* Scene 4: New primary stars at hero's final position */}
      {currentScene.scene === 4 && (
        <PrimaryStars
          key="primary-stars-2"
          radius={currentScene.newPrimaryStars?.radius || 100}
          count={currentScene.newPrimaryStars?.count || 15}
          size={currentScene.newPrimaryStars?.baseSize || 12.0}
          xOffset={currentScene.newPrimaryStars?.xOffset || 150}
          zOffset={currentScene.newPrimaryStars?.zOffset || 0}
          opacity={theatreNewPrimaryStarsOpacity}
          onPositionsReady={(positions) => {
            newPrimaryStarPositionsRef.current = positions
          }}
        />
      )}

      {/* Scene 4: Old constellation at origin (fades as camera moves away) */}
      {currentScene.scene === 4 && theatreOldPrimaryStarsOpacity > 0.05 && (
        <PrimaryStars
          key="old-primary-stars-scene4"
          radius={currentScene.primaryStars?.radius || 100}
          count={currentScene.primaryStars?.count || 15}
          size={currentScene.primaryStars?.baseSize || 12.0}
          opacity={theatreOldPrimaryStarsOpacity}
          onPositionsReady={() => {}} // Don't update positions - keep the ones from Scene 3
        />
      )}

      {/* Scene 4: Old constellation lines (fade out as hero leaves) */}
      {currentScene.scene === 4 &&
        theatreOldConstellationOpacity > 0.05 &&
        primaryStarPositions && (
          <HeroConstellationLines
            heroPosition={[0, 0, 0]}
            starPositions={primaryStarPositions}
            color={currentScene.connectionLines?.color || '#22d3ee'}
            opacity={theatreOldConstellationOpacity}
            fadeInDuration={0}
          />
        )}

      {/* Scene 4: New constellation (fading in) - connects hero to new stars */}
      {currentScene.scene === 4 &&
        theatreNewConstellationOpacity > 0.05 &&
        newPrimaryStarPositionsRef.current &&
        newPrimaryStarPositionsRef.current.length > 0 &&
        heroStarGroupRef.current && (
          <HeroConstellationLines
            heroPosition={[
              heroStarGroupRef.current.position.x,
              heroStarGroupRef.current.position.y,
              heroStarGroupRef.current.position.z,
            ]}
            starPositions={newPrimaryStarPositionsRef.current}
            color={currentScene.connectionLines?.color || '#22d3ee'}
            opacity={theatreNewConstellationOpacity}
            fadeInDuration={0}
          />
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
