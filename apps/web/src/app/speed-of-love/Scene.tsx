import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AnimationCommand, Scene as SceneData } from './types'
import { PerspectiveCamera } from '@react-three/drei'
import BackgroundStars from './BackgroundStars'
import PrimaryStars from './PrimaryStars'
import CentralStar from './CentralStar'
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
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
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
  const [theatrePrimaryStarsOpacity, setTheatrePrimaryStarsOpacity] = useState(0.3)
  const [theatreConstellationOpacity, setTheatreConstellationOpacity] = useState(0)
  
  // Scene 4: Theatre.js animated values
  const [theatreOldConstellationOpacity, setTheatreOldConstellationOpacity] = useState(1.0)
  const [theatreOldPrimaryStarsOpacity, setTheatreOldPrimaryStarsOpacity] = useState(1.0)
  const [theatreCameraX, setTheatreCameraX] = useState(0)
  const [theatreHeroStarX, setTheatreHeroStarX] = useState(0)
  const [theatreNewPrimaryStarsOpacity, setTheatreNewPrimaryStarsOpacity] = useState(0)
  const [theatreNewConstellationOpacity, setTheatreNewConstellationOpacity] = useState(0)
  
  const [otherStarsOpacity, setOtherStarsOpacity] = useState(1.0)
  const [primaryStarPositions, setPrimaryStarPositions] =
    useState<Float32Array | null>(null)
  const [newPrimaryStarPositions, setNewPrimaryStarPositions] =
    useState<Float32Array | null>(null)
  const newPrimaryStarPositionsRef = useRef<Float32Array | null>(null) // Immediate access, no React delay
  const [twinklingEnabled, setTwinklingEnabled] = useState(false)

  // Scene 4: Orbit change animation states (using refs for smooth lerping)
  const constellationOpacity = useRef(1.0)
  const targetConstellationOpacity = useRef(1.0)
  const oldPrimaryOpacity = useRef(1.0)
  const targetOldPrimaryOpacity = useRef(1.0)
  const newPrimaryOpacity = useRef(0.0)
  const targetNewPrimaryOpacity = useRef(0.0)
  const [showNewConstellation, setShowNewConstellation] = useState(false)
  const orbitChangeStartTime = useRef<number>(0)
  const cameraXOffset = useRef(0)
  const targetCameraXOffset = useRef(0)
  const cameraYOffset = useRef(0)
  const targetCameraYOffset = useRef(0)
  const cameraZOffset = useRef(0)
  const targetCameraZOffset = useRef(0)
  const travelDistance = useRef(0) // Track how far we've traveled for fade calculation
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

  // Fade primary stars back to full brightness in Scene 3
  useEffect(() => {
    if (currentScene.sceneType === 'constellationForm') {
      setOtherStarsOpacity(1.0)
      setTwinklingEnabled(true) // Start twinkling in Scene 3
      // Reset Scene 4 animation state when entering Scene 3
      oldPrimaryOpacity.current = 1.0
      targetOldPrimaryOpacity.current = 1.0
    }
  }, [currentScene.sceneType])

  // Scene 4: Orbit change animation sequence
  useEffect(() => {
    if (currentScene.sceneType === 'orbitChange') {
      orbitChangeStartTime.current = Date.now()
      const phases = currentScene.phases || {
        fadeOutConstellation: 1500,
        travelDuration: 6000,
        arrivalPause: 1000,
        newConstellationFadeIn: 1000,
      }

      // Reset to initial state
      constellationOpacity.current = 1.0
      targetConstellationOpacity.current = 1.0
      oldPrimaryOpacity.current = 1.0
      targetOldPrimaryOpacity.current = 1.0
      newPrimaryOpacity.current = 0.0
      targetNewPrimaryOpacity.current = 0.0
      cameraXOffset.current = 0
      targetCameraXOffset.current = 0
      cameraYOffset.current = 0
      targetCameraYOffset.current = 0
      cameraZOffset.current = 0
      targetCameraZOffset.current = 0
      travelDistance.current = 0
      setShowNewConstellation(false)

      // Phase 1: Start traveling - move camera (and hero star with it) away from old constellation
      setTimeout(() => {
        // Camera moves in new direction (right and down and forward)
        targetCameraXOffset.current = 150 // Move right
        targetCameraYOffset.current = 0 // -80 // Move down
        targetCameraZOffset.current = 0 // 200 // Move forward (away from old constellation at Z=0)
      }, 100)

      // Phase 2: New stars start fading in early during travel
      setTimeout(() => {
        targetNewPrimaryOpacity.current = 1.0
      }, 2000) // Start 2 seconds in, during travel

      // Phase 4: Show new constellation after pause
      setTimeout(() => {
        setShowNewConstellation(true)
      }, phases.fadeOutConstellation + phases.travelDuration + phases.arrivalPause)
    } else {
      // Reset for other scenes
      constellationOpacity.current = 1.0
      targetConstellationOpacity.current = 1.0
      oldPrimaryOpacity.current = 1.0
      targetOldPrimaryOpacity.current = 1.0
      newPrimaryOpacity.current = 0.0
      targetNewPrimaryOpacity.current = 0.0
      cameraXOffset.current = 0
      cameraYOffset.current = 0
      cameraZOffset.current = 0
      travelDistance.current = 0
      setShowNewConstellation(false)
    }
  }, [currentScene.sceneType, currentScene.phases, newPrimaryStarPositions])

  // Theatre.js: Read animated values every frame and update React state
  useFrame(() => {
    const animation = getSceneAnimation(currentScene.scene)
    if (!animation) return
    
    // Scene 1: Read stars opacity
    if (currentScene.scene === 1) {
      setTheatreStarsOpacity(animation.value.starsOpacity)
    }
    
    // Scene 2: Read hero star opacity and scale
    if (currentScene.scene === 2) {
      setTheatreHeroStarOpacity(animation.value.heroStarOpacity)
      setTheatreHeroStarScale(animation.value.heroStarScale)
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
      setTheatreHeroStarX(animation.value.heroStarX)
      setTheatreNewPrimaryStarsOpacity(animation.value.newPrimaryStarsOpacity)
      setTheatreNewConstellationOpacity(animation.value.newConstellationOpacity)
    }
  })

  // Scene 4: Apply Theatre.js camera and hero star positions
  useFrame(() => {
    if (currentScene.scene === 4 && cameraRef.current) {
      // Apply Theatre.js camera position directly
      cameraRef.current.position.x = theatreCameraX
      
      // Update hero star group position to match Theatre.js value
      if (heroStarGroupRef.current) {
        heroStarGroupRef.current.position.x = theatreHeroStarX
      }
    }
  })

  // OLD Scene 4 animation loop (will be removed once Theatre.js is working)
  useFrame(() => {
    // Scene 4: Camera travels away from old constellation
    // if (currentScene.sceneType === 'orbitChange' && cameraRef.current) {
    if (false && currentScene.scene === 4 && cameraRef.current) {
      // Animate camera movement
      cameraXOffset.current = THREE.MathUtils.lerp(
        cameraXOffset.current,
        targetCameraXOffset.current,
        0.008,
      )
      cameraYOffset.current = THREE.MathUtils.lerp(
        cameraYOffset.current,
        targetCameraYOffset.current,
        0.008,
      )
      cameraZOffset.current = THREE.MathUtils.lerp(
        cameraZOffset.current,
        targetCameraZOffset.current,
        0.008,
      )

      // Calculate travel distance for fade
      travelDistance.current = Math.sqrt(
        cameraXOffset.current ** 2 +
          cameraYOffset.current ** 2 +
          cameraZOffset.current ** 2,
      )

      // Fade old constellation based on distance (fade out over 250 units)
      constellationOpacity.current = Math.max(
        0,
        1.0 - travelDistance.current / 250,
      )
      oldPrimaryOpacity.current = Math.max(
        0,
        1.0 - travelDistance.current / 250,
      )

      // Apply camera offset
      const basePos = currentScene.cameraPosition || [0, 0, 150]
      cameraRef.current.position.set(
        basePos[0] + cameraXOffset.current,
        basePos[1] + cameraYOffset.current,
        basePos[2] + cameraZOffset.current,
      )

      // Move hero star with camera so it stays centered
      if (heroStarGroupRef.current) {
        heroStarGroupRef.current.position.set(
          cameraXOffset.current,
          cameraYOffset.current,
          cameraZOffset.current,
        )
      }

      // New stars are at fixed position (X=200), camera moves toward them

      // Fade in new stars
      newPrimaryOpacity.current = THREE.MathUtils.lerp(
        newPrimaryOpacity.current,
        targetNewPrimaryOpacity.current,
        0.015,
      )

      // Minimal debug logging - only log significant state changes
      // (Removed spammy per-frame logging)
    }

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

      {/* Background stars - Scene 1 uses Theatre.js, others use old approach */}
      <BackgroundStars
        key="background-stars"
        radius={400}
        count={2000}
        size={3.0}
        opacity={currentScene.scene === 1 ? 0.8 * theatreStarsOpacity : 0.8 * otherStarsOpacity}
        enableTwinkling={twinklingEnabled}
      />

      {/* Scene 1: Stars controlled by Theatre.js */}
      {currentScene.scene === 1 && (
        <PrimaryStars
          key="primary-stars-1"
          radius={100}
          count={15}
          size={8.0}
          opacity={theatreStarsOpacity}
          onPositionsReady={setPrimaryStarPositions}
        />
      )}

      {/* Scene 2: Primary stars dimmed */}
      {currentScene.scene === 2 && (
        <PrimaryStars
          key="primary-stars-1"
          radius={100}
          count={15}
          size={8.0}
          opacity={otherStarsOpacity}
          onPositionsReady={setPrimaryStarPositions}
        />
      )}

      {/* Scene 3: Primary stars controlled by Theatre.js */}
      {currentScene.scene === 3 && (
        <PrimaryStars
          key="primary-stars-1"
          radius={100}
          count={15}
          size={8.0}
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
      {/* {(currentScene.sceneType === 'focusStar' ||
        currentScene.sceneType === 'constellationForm' ||
        currentScene.sceneType === 'orbitChange') && ( */}
      {currentScene.scene > 1 && currentScene.scene < 5 && (
        <group ref={heroStarGroupRef}>
          <CentralStar
            brightness={currentScene.centralStar?.brightness || 1.5}
            animationDuration={
              currentScene.sceneType === 'focusStar' ? 3000 : 0
            }
            onProgressChange={
              currentScene.sceneType === 'focusStar'
                ? setOtherStarsOpacity
                : undefined
            }
            opacity={
              currentScene.scene === 2 ? theatreHeroStarOpacity :
              currentScene.scene === 3 ? 1.0 : // Stay at full opacity in Scene 3
              undefined
            }
            scale={
              currentScene.scene === 2 ? theatreHeroStarScale :
              currentScene.scene === 3 ? 1.0 : // Stay at full scale in Scene 3
              undefined
            }
          />
        </group>
      )}

      {/* Scene 4: New primary stars at hero's final position */}
      {currentScene.scene === 4 && (
        <PrimaryStars
          key="primary-stars-2"
          radius={100}
          count={15}
          size={8}
          xOffset={150}
          zOffset={0}
          opacity={theatreNewPrimaryStarsOpacity}
          onPositionsReady={(positions) => {
            newPrimaryStarPositionsRef.current = positions
            setNewPrimaryStarPositions(positions)
          }}
        />
      )}

      {/* Scene 4: Old constellation at origin (fades as camera moves away) */}
      {currentScene.scene === 4 && theatreOldPrimaryStarsOpacity > 0.05 && (
        <PrimaryStars
          key="old-primary-stars-scene4"
          radius={100}
          count={15}
          size={8.0}
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
