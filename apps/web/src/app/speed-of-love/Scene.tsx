import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene as SceneData } from './types'
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
      a.download = 'theatre-state.json'
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
  currentScene: SceneData
}

export default function Scene({ currentScene }: SceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  // State to hold Theatre.js animated values
  const [theatreBackgroundStarsOpacity, setTheatreBackgroundStarsOpacity] =
    useState(0)
  const [theatreHeroStarOpacity, setTheatreHeroStarOpacity] = useState(0)
  const [theatreHeroStarScale, setTheatreHeroStarScale] = useState(0)
  const [theatrePrimaryStarsOpacity, setTheatrePrimaryStarsOpacity] =
    useState(0)
  const [theatreConstellationOpacity, setTheatreConstellationOpacity] =
    useState(0)

  // Scene 4: Theatre.js animated values
  const [theatreOldConstellationOpacity, setTheatreOldConstellationOpacity] =
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
  const [theatreWavePhase, setTheatreWavePhase] = useState(0)
  const [theatreFlashIntensity, setTheatreFlashIntensity] = useState(0)

  const [primaryStarPositions, setPrimaryStarPositions] =
    useState<Float32Array | null>(null)
  const newPrimaryStarPositionsRef = useRef<Float32Array | null>(null) // Immediate access, no React delay
  const [twinklingEnabled, setTwinklingEnabled] = useState(false)
  const heroStarGroupRef = useRef<THREE.Group>(null)

  // ============================================================================
  // PROPERTY-BASED HELPERS
  // Instead of hardcoding scene numbers (e.g., if scene === 3 || scene === 7),
  // these helpers check which animation properties are defined in Theatre.js.
  // This makes the code automatically work for any scene that defines those properties.
  // ============================================================================

  // Helper: Check if current scene animates camera/hero position
  const sceneAnimatesPosition = useMemo(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return false
    const values = animation.value
    return (
      values.cameraX !== undefined ||
      values.cameraY !== undefined ||
      values.cameraZ !== undefined ||
      values.heroStarX !== undefined ||
      values.heroStarY !== undefined ||
      values.heroStarZ !== undefined
    )
  }, [currentScene.scene])

  // Helper: Get hero star opacity (checks if scene animates it)
  const getHeroStarOpacity = useMemo(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return 1.0
    return animation.value.heroStarOpacity !== undefined
      ? theatreHeroStarOpacity
      : 1.0
  }, [currentScene.scene, theatreHeroStarOpacity])

  // Helper: Get hero star scale (checks if scene animates it)
  const getHeroStarScale = useMemo(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return 1.0
    return animation.value.heroStarScale !== undefined
      ? theatreHeroStarScale
      : 1.0
  }, [currentScene.scene, theatreHeroStarScale])

  // Helper: Get constellation opacity (Scene 3/7 use constellationOpacity, Scene 4 uses oldConstellationOpacity)
  const getConstellationOpacity = useMemo(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return 0
    const values = animation.value
    if (values.constellationOpacity !== undefined) {
      return theatreConstellationOpacity
    }
    if (values.oldConstellationOpacity !== undefined) {
      return theatreOldConstellationOpacity
    }
    return 0
  }, [
    currentScene.scene,
    theatreConstellationOpacity,
    theatreOldConstellationOpacity,
  ])

  // Helper: Get background stars opacity
  const getBackgroundStarsOpacity = useMemo(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return 0.8
    const values = animation.value

    // Scene 1, 6, 7: backgroundStarsOpacity
    if (values.backgroundStarsOpacity !== undefined) {
      return theatreBackgroundStarsOpacity
    }
    // Scene 2: Dim background stars with primary stars (scaled by 0.8)
    if (currentScene.scene === 2 && values.primaryStarsOpacity !== undefined) {
      return 0.8 * theatrePrimaryStarsOpacity
    }

    return 0.8 // Default
  }, [
    currentScene.scene,
    theatreBackgroundStarsOpacity,
    theatrePrimaryStarsOpacity,
  ])

  // Theatre.js: Auto-play animations when scenes load
  useEffect(() => {
    // Skip if scene hasn't been initialized yet (scenes are 1-indexed)
    if (currentScene.scene === 0) return

    // Wait for Theatre.js project to load before playing
    theatreProject.ready.then(() => {
      const sheet = getSceneSheet(currentScene.scene)
      if (!sheet) {
        console.warn(`Sheet not found for scene ${currentScene.scene}`)
        return
      }

      // Calculate duration AFTER Theatre.js is ready and sheets are initialized
      const duration = getSceneDuration(currentScene.scene)
      console.log(`Scene ${currentScene.scene} duration:`, duration)

      if (duration > 0) {
        sheet.sequence.play({ range: [0, duration] })
      }
    })

    // Cleanup: pause sequence when scene changes
    return () => {
      const sheet = getSceneSheet(currentScene.scene)
      if (sheet) {
        sheet.sequence.pause()
      }
    }
  }, [currentScene.scene])

  // Enable twinkling in Scene 3
  useEffect(() => {
    if (currentScene.sceneType === 'constellationForm') {
      setTwinklingEnabled(true)
    }
  }, [currentScene.sceneType])

  // Initialize camera position from Theatre.js for scenes that animate it
  useEffect(() => {
    if (sceneAnimatesPosition && cameraRef.current) {
      // Set initial camera position immediately from static overrides
      cameraRef.current.position.set(
        theatreCameraX,
        theatreCameraY,
        theatreCameraZ,
      )
    }
  }, [
    currentScene.scene,
    theatreCameraX,
    theatreCameraY,
    theatreCameraZ,
    sceneAnimatesPosition,
  ])

  // ============================================================================
  // THEATRE.JS VALUE READING (Property-Based)
  // Reads animated values every frame and updates React state.
  // Instead of checking scene numbers, we check if each property exists in the
  // current scene's animation. This makes it work automatically for any scene.
  // ============================================================================
  useFrame(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return

    const values = animation.value

    // Background stars opacity (Scene 1, 6, 7)
    if (values.backgroundStarsOpacity !== undefined) {
      setTheatreBackgroundStarsOpacity(values.backgroundStarsOpacity)
    }

    // Hero star appearance (Scene 2, 6, 7)
    if (values.heroStarOpacity !== undefined) {
      setTheatreHeroStarOpacity(values.heroStarOpacity)
    }
    if (values.heroStarScale !== undefined) {
      setTheatreHeroStarScale(values.heroStarScale)
    }

    // Primary stars opacity (Scene 1, 2, 3, 7)
    if (values.primaryStarsOpacity !== undefined) {
      setTheatrePrimaryStarsOpacity(values.primaryStarsOpacity)
    }

    // Scene 4 special case: oldPrimaryStarsOpacity maps to same state var as Scene 3
    if (values.oldPrimaryStarsOpacity !== undefined) {
      setTheatrePrimaryStarsOpacity(values.oldPrimaryStarsOpacity)
    }

    // Constellation opacity (Scene 3, 7)
    if (values.constellationOpacity !== undefined) {
      setTheatreConstellationOpacity(values.constellationOpacity)
    }

    // Old constellation opacity (Scene 4)
    if (values.oldConstellationOpacity !== undefined) {
      setTheatreOldConstellationOpacity(values.oldConstellationOpacity)
    }

    // New primary stars and constellation (Scene 4, 5)
    if (values.newPrimaryStarsOpacity !== undefined) {
      setTheatreNewPrimaryStarsOpacity(values.newPrimaryStarsOpacity)
    }
    if (values.newConstellationOpacity !== undefined) {
      setTheatreNewConstellationOpacity(values.newConstellationOpacity)
    }

    // Background stars opacity (Scene 6, 7)
    if (values.backgroundStarsOpacity !== undefined) {
      setTheatreBackgroundStarsOpacity(values.backgroundStarsOpacity)
    }

    // Camera position (Scene 4, 5, 6, 7)
    if (values.cameraX !== undefined) {
      setTheatreCameraX(values.cameraX)
    }
    if (values.cameraY !== undefined) {
      setTheatreCameraY(values.cameraY)
    }
    if (values.cameraZ !== undefined) {
      setTheatreCameraZ(values.cameraZ)
    }

    // Hero star position (Scene 4, 5, 6, 7)
    if (values.heroStarX !== undefined) {
      setTheatreHeroStarX(values.heroStarX)
    }
    if (values.heroStarY !== undefined) {
      setTheatreHeroStarY(values.heroStarY)
    }
    if (values.heroStarZ !== undefined) {
      setTheatreHeroStarZ(values.heroStarZ)
    }

    // Cosmic wave phase (Scene 5)
    if (values.wavePhase !== undefined) {
      setTheatreWavePhase(values.wavePhase)
    }
    
    // Flash intensity (Scene 5)
    if (values.flashIntensity !== undefined) {
      setTheatreFlashIntensity(values.flashIntensity)
    }
  })

  // Apply Theatre.js camera and hero star positions for scenes that animate them
  useFrame(() => {
    if (sceneAnimatesPosition && cameraRef.current) {
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

  // Note: All animations now controlled by Theatre.js
  // Camera movement, opacity changes, etc. are handled via Theatre.js properties

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={1} />
      
      {/* Flash overlay for explosion effect (Scene 5) */}
      {theatreFlashIntensity > 0 && (
        <mesh position={[0, 0, -10]} renderOrder={999}>
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={theatreFlashIntensity}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Background stars - All scenes use Theatre.js or static values */}
      <BackgroundStars
        key="background-stars"
        radius={currentScene.backgroundStars?.radius || 400}
        count={currentScene.backgroundStars?.count || 2000}
        size={currentScene.backgroundStars?.baseSize || 3.0}
        opacity={getBackgroundStarsOpacity}
        enableTwinkling={twinklingEnabled}
      />

      {/* Primary stars at origin (old constellation) */}
      {currentScene.visibility?.primaryStars && (
        <PrimaryStars
          key="primary-stars-1"
          radius={currentScene.primaryStars?.radius || 100}
          count={currentScene.primaryStars?.count || 15}
          size={currentScene.primaryStars?.baseSize || 6.0}
          seed={12345} // Same seed ensures same star positions across scenes
          xOffset={currentScene.primaryStars?.xOffset || 0}
          yOffset={currentScene.primaryStars?.yOffset || 0}
          zOffset={currentScene.primaryStars?.zOffset || 0}
          opacity={
            currentScene.visibility?.primaryStars
              ? theatrePrimaryStarsOpacity
              : 1.0
          }
          onPositionsReady={setPrimaryStarPositions}
        />
      )}

      {/* Constellation lines connecting hero to primary stars (old constellation) */}
      {currentScene.visibility?.oldConstellation &&
        primaryStarPositions &&
        primaryStarPositions.length > 0 &&
        heroStarGroupRef.current && (
          <HeroConstellationLines
            heroPosition={[0, 0, 0]}
            starPositions={primaryStarPositions}
            color={currentScene.connectionLines?.color || '#22d3ee'}
            opacity={getConstellationOpacity}
            fadeInDuration={0} // Theatre.js controls the fade
          />
        )}

      {/* Hero star - moves with camera in Scene 4 & 5 */}
      {currentScene.visibility?.heroStar && (
        <group ref={heroStarGroupRef}>
          <HeroStar
            brightness={currentScene.heroStar?.brightness || 1.5}
            opacity={getHeroStarOpacity}
            scale={getHeroStarScale}
          />
        </group>
      )}

      {/* New primary stars at hero's final position */}
      {currentScene.visibility?.newPrimaryStars && (
        <PrimaryStars
          key="primary-stars-2"
          radius={currentScene.newPrimaryStars?.radius || 100}
          count={currentScene.newPrimaryStars?.count || 15}
          size={currentScene.newPrimaryStars?.baseSize || 6.0}
          seed={67890} // Different seed for different star positions
          xOffset={currentScene.newPrimaryStars?.xOffset || 250}
          yOffset={currentScene.newPrimaryStars?.yOffset || -100}
          zOffset={currentScene.newPrimaryStars?.zOffset || -50}
          opacity={theatreNewPrimaryStarsOpacity}
          wavePhase={currentScene.scene === 5 ? theatreWavePhase : 0}
          onPositionsReady={(positions) => {
            newPrimaryStarPositionsRef.current = positions
          }}
        />
      )}

      {/* New constellation - connects hero to new stars */}
      {currentScene.visibility?.newConstellation &&
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
        position={
          sceneAnimatesPosition
            ? undefined // Theatre.js controls position for scenes that animate it
            : currentScene.cameraPosition || [0, 0, 150]
        }
        fov={currentScene.cameraFOV || 60}
        near={0.1}
        far={2000}
      />
    </>
  )
}
