import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { StarOverlay, StarData, JourneyPhase } from './types'
import { MOCK_PEOPLE } from './mockData'
import { getStarRadius } from './starData'
import Star from './Star'
import BackgroundStars from './BackgroundStars'
import ShootingStar from './ShootingStar'
import { ConstellationLines } from './ConstellationLines'
import HUD3D from './HUD3D'

interface SceneProps {
  stars: Map<string, StarData>
  onUpdateStars: (
    updater: (prev: Map<string, StarData>) => Map<string, StarData>,
  ) => void
  onUpdateOverlays: (overlays: StarOverlay[]) => void
  targetStarIndex: number
  previousStarIndex: number
  onApproaching: (personName: string) => void
  onArrived: (personName: string) => void
  onTakeoffComplete: () => void
  onReturnComplete: () => void
  journeyPhase: JourneyPhase
  useConstellationPositions: boolean
  viewportDimensions: { width: number; height: number }
  manualControlsEnabled: boolean
}

export default function Scene({
  stars,
  onUpdateStars,
  onUpdateOverlays,
  targetStarIndex,
  previousStarIndex,
  onApproaching,
  onArrived,
  onTakeoffComplete,
  onReturnComplete,
  journeyPhase,
  useConstellationPositions,
  viewportDimensions,
  manualControlsEnabled,
}: SceneProps) {
  const { camera, size } = useThree()
  const [nearestStarId, setNearestStarId] = useState<string | null>(null)
  const [texturesLoaded, setTexturesLoaded] = useState(false)
  const targetPosition = useRef(new THREE.Vector3())
  const hasInitialized = useRef(false)
  const hasTriggeredApproaching = useRef(false)
  const hasTriggeredArrival = useRef(false)
  const takeoffProgress = useRef(0)
  const takeoffStartPos = useRef(new THREE.Vector3())
  const takeoffEndLookAt = useRef(new THREE.Vector3())
  const cameFromTakeoff = useRef(false)
  const lastTakeoffFrame = useRef(-1)
  const takeoffFrameCount = useRef(0)
  const flightProgress = useRef(0)
  const flightStartPos = useRef(new THREE.Vector3())
  const flightControlPoint = useRef(new THREE.Vector3())
  const isFlying = useRef(false)
  const initialFlightDistance = useRef(0)
  const returnProgress = useRef(0)
  const returnStartPos = useRef(new THREE.Vector3())
  const constellationCenter = useRef(new THREE.Vector3(0, 0, 0))
  const autoPilotCameraPos = useRef(new THREE.Vector3())
  const autoPilotCameraTarget = useRef(new THREE.Vector3())
  const previousManualControlsEnabled = useRef(manualControlsEnabled)

  // Preload all textures before rendering any stars
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const textureMap = new Map<string, THREE.Texture>()
    let loadedCount = 0

    MOCK_PEOPLE.forEach((person) => {
      const texture = loader.load(
        person.photo,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          // Use better filtering to avoid edge artifacts
          tex.minFilter = THREE.LinearFilter
          tex.magFilter = THREE.LinearFilter
          tex.wrapS = THREE.ClampToEdgeWrapping
          tex.wrapT = THREE.ClampToEdgeWrapping
          tex.needsUpdate = true
          loadedCount++
          if (loadedCount === MOCK_PEOPLE.length) {
            setTexturesLoaded(true)
          }
        },
        undefined,
        (_error) => {
          // Texture load error - will retry or use fallback
          // Don't log in production as these are expected during initial load
          loadedCount++
          if (loadedCount === MOCK_PEOPLE.length) {
            setTexturesLoaded(true)
          }
        },
      )
      textureMap.set(person.id, texture)
    })

    return textureMap
  }, [])

  // Gaussian random helper for organic clustering
  const _gaussianRandom = (mean = 0, stdev = 1) => {
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z0 * stdev + mean
  }

  // Generate positions if they don't exist yet
  useEffect(() => {
    const starsArray = Array.from(stars.values())
    const needsInitialPositions = starsArray.some((s) => !s.initialPosition)
    const needsConstellationPositions =
      useConstellationPositions &&
      starsArray.some((s) => s.placement && !s.constellationPosition)

    if (!needsInitialPositions && !needsConstellationPositions) return

    onUpdateStars((prevStars) => {
      const newStars = new Map(prevStars)
      const positions: [number, number, number][] = []
      const minDistance = 15
      const maxAttempts = 50

      MOCK_PEOPLE.forEach((person) => {
        const starData = newStars.get(person.id)!

        // Generate initial position if missing
        if (!starData.initialPosition) {
          let attempts = 0
          let validPosition = false
          let newPos: [number, number, number]
          const { min, max } = getStarRadius(undefined)

          while (!validPosition && attempts < maxAttempts) {
            const theta = Math.random() * Math.PI * 2
            const maxPhi = Math.PI / 4
            const phi = Math.random() * maxPhi
            const radius = min + Math.random() * (max - min)

            newPos = [
              radius * Math.sin(phi) * Math.cos(theta),
              -10 + radius * Math.sin(phi) * Math.sin(theta),
              radius * Math.cos(phi),
            ]

            validPosition = positions.every((existingPos) => {
              const dx = newPos[0] - existingPos[0]
              const dy = newPos[1] - existingPos[1]
              const dz = newPos[2] - existingPos[2]
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
              return distance >= minDistance
            })
            attempts++
          }

          positions.push(newPos!)
          newStars.set(person.id, { ...starData, initialPosition: newPos! })
        } else {
          positions.push(starData.initialPosition)
        }

        // Generate constellation position if placed and missing
        if (
          useConstellationPositions &&
          starData.placement &&
          !starData.constellationPosition
        ) {
          const { min, max } = getStarRadius(starData.placement)

          // Z-depth ranges: closer stars have higher z-values (toward camera)
          const getZRange = (placement: 'inner' | 'close' | 'outer') => {
            if (placement === 'inner') return { min: 8, max: 12 } // Closest to camera
            if (placement === 'close') return { min: 3, max: 7 } // Middle depth
            return { min: -2, max: 2 } // Farthest from camera
          }

          const zRange = getZRange(starData.placement)
          const theta = Math.random() * Math.PI * 2
          const xyRadius = min + Math.random() * (max - min)
          const zPosition =
            zRange.min + Math.random() * (zRange.max - zRange.min)

          const constellationPos: [number, number, number] = [
            xyRadius * Math.cos(theta),
            -10 + xyRadius * Math.sin(theta),
            zPosition,
          ]

          newStars.set(person.id, {
            ...starData,
            constellationPosition: constellationPos,
          })
        }
      })

      return newStars
    })
  }, [stars, useConstellationPositions, onUpdateStars])

  // Get current positions from StarData
  // During journey: ALWAYS use initialPosition
  // During constellation view: use constellationPosition if available
  const starPositions = useMemo(() => {
    const positions = MOCK_PEOPLE.map((person) => {
      const starData = stars.get(person.id)!

      // ONLY use constellation positions when explicitly in constellation view mode
      if (useConstellationPositions && starData.constellationPosition) {
        return starData.constellationPosition
      }

      // During journey, always use initial position (never changes)
      const pos =
        starData.initialPosition || ([0, 0, 0] as [number, number, number])
      return pos
    })
    return positions
  }, [stars, useConstellationPositions])

  // Stars are visited in MOCK_PEOPLE order, tracked by visitedIndices

  // Auto-pilot: initialize with overview, then move to target star
  useFrame((state) => {
    const frameId = state.clock.elapsedTime
    
    // Handle manual controls toggle
    if (manualControlsEnabled !== previousManualControlsEnabled.current) {
      if (manualControlsEnabled) {
        // Switching TO manual mode: camera position already saved at end of return animation
        // No need to update camera - it's already in the correct position
      } else {
        // Switching FROM manual mode back to auto-pilot: restore saved camera state
        camera.position.copy(autoPilotCameraPos.current)
        camera.lookAt(autoPilotCameraTarget.current)
      }
      previousManualControlsEnabled.current = manualControlsEnabled
    }
    
    // Skip auto-pilot camera updates when manual controls are enabled
    if (manualControlsEnabled) {
      return
    }
    
    // First time: set overview position
    if (!hasInitialized.current) {
      // Position camera further back to show all stars in HUD initially
      const isMobile = viewportDimensions.width < 640

      // Measure actual DOM elements to match StarField.tsx
      const header =
        typeof window !== 'undefined'
          ? document.querySelector('h1')?.parentElement
          : null
      const headerRect = header?.getBoundingClientRect()
      const headerBottom = headerRect ? headerRect.bottom : 0

      const navPanel =
        typeof window !== 'undefined'
          ? document.getElementById('nav-panel')
          : null
      const navPanelRect = navPanel?.getBoundingClientRect()
      const navPanelTop = navPanelRect
        ? navPanelRect.top
        : viewportDimensions.height

      // HUD dimensions (matches StarField.tsx)
      const hudHeight = isMobile
        ? Math.min(300, viewportDimensions.height * 0.35)
        : Math.min(600, viewportDimensions.height * 0.5)

      // Calculate available space and HUD position (matches StarField.tsx exactly)
      const navPanelHeight = viewportDimensions.height - navPanelTop
      const availableSpace =
        viewportDimensions.height - headerBottom - navPanelHeight
      const topPosition = headerBottom + (availableSpace - hudHeight) / 2

      // HUD center in screen space
      const hudCenterY = topPosition + hudHeight / 2
      const viewportCenterY = viewportDimensions.height / 2
      const hudOffsetPx = hudCenterY - viewportCenterY

      // Convert HUD offset to world space
      const fovRadians = (60 * Math.PI) / 180
      const zDistance = 180
      const worldHeightAtDistance = 2 * zDistance * Math.tan(fovRadians / 2)
      const pixelsToWorldUnits =
        worldHeightAtDistance / viewportDimensions.height

      // Screen Y increases downward, World Y increases upward
      // If HUD is BELOW viewport center (positive offset), camera moves UP (positive Y)
      // to make stars appear higher on screen
      // Add adjustment to center better (larger on mobile due to URL bar)
      const adjustmentFactor = isMobile ? 1.3 : 1.15
      const yOffset = hudOffsetPx * pixelsToWorldUnits * adjustmentFactor

      camera.position.set(0, yOffset, zDistance)
      camera.lookAt(0, yOffset, 0)
      hasInitialized.current = true
    }

    // Handle takeoff sequence (pull back from current star before flying to next)
    if (
      journeyPhase === 'takeoff' &&
      previousStarIndex >= 0 &&
      previousStarIndex < MOCK_PEOPLE.length
    ) {
      const currentStarPos = new THREE.Vector3(
        ...starPositions[previousStarIndex],
      )
      const nextTargetPos = new THREE.Vector3(...starPositions[targetStarIndex])

      // Only update once per actual animation frame using frame counter
      takeoffFrameCount.current++
      const shouldUpdate =
        takeoffFrameCount.current === 1 ||
        (takeoffFrameCount.current > 1 && lastTakeoffFrame.current !== frameId)

      if (shouldUpdate) {
        lastTakeoffFrame.current = frameId

        // Initialize on first frame of takeoff
        if (takeoffProgress.current === 0) {
          takeoffFrameCount.current = 0
          takeoffStartPos.current.copy(camera.position)
        }

        takeoffProgress.current += 0.015 // Takeoff speed (balanced for smooth but not too slow)
      }

      if (takeoffProgress.current >= 1) {
        // Takeoff complete, transition to flying
        takeoffProgress.current = 0
        cameFromTakeoff.current = true // Mark that we came from takeoff
        // Save the lookAt direction at end of takeoff
        takeoffEndLookAt.current.copy(nextTargetPos)
        onTakeoffComplete() // Trigger transition to flying phase
      } else {
        const t = takeoffProgress.current

        // Pull camera straight back (no lateral movement during takeoff)
        const pullBackDistance = 30 // Units to pull back

        // Keep X/Y position, only move back in Z
        const newZ = takeoffStartPos.current.z + pullBackDistance * t

        camera.position.set(
          takeoffStartPos.current.x,
          takeoffStartPos.current.y,
          newZ,
        )

        // Gradually rotate camera from previous star to next target
        // Start rotation after 70% of takeoff, complete by end
        // This keeps Alice centered longer during the pullback

        if (t < 0.7) {
          // First 70%: keep looking at previous star (Alice)
          camera.lookAt(currentStarPos)
        } else {
          // Final 30%: gradually rotate toward next target (Bob)
          const rotateProgress = (t - 0.7) / 0.3 // 0 to 1 over remaining time
          // Ease the rotation for smoother feel
          const easedProgress =
            rotateProgress * rotateProgress * (3 - 2 * rotateProgress) // Smoothstep
          const lookAtPoint = new THREE.Vector3().lerpVectors(
            currentStarPos,
            nextTargetPos,
            easedProgress,
          )
          camera.lookAt(lookAtPoint)
        }
      }
    }

    // Reset return progress when leaving constellation view
    if (journeyPhase !== 'returning' && returnProgress.current > 0) {
      returnProgress.current = 0
    }

    // Reset return progress when switching from manual back to auto-pilot
    // This allows the smooth return animation to play again
    if (
      journeyPhase === 'returning' &&
      !manualControlsEnabled &&
      returnProgress.current >= 1
    ) {
      returnProgress.current = 0
    }

    // Handle return to constellation view
    if (journeyPhase === 'returning' && !manualControlsEnabled) {
      if (returnProgress.current === 0) {
        // Initialize return flight
        returnStartPos.current.copy(camera.position)
        returnProgress.current = 0.001 // Start slightly above 0
      }

      // Only animate if not yet complete
      if (returnProgress.current >= 1 && returnProgress.current < 1.5) {
        // Return complete - stop animating but stay in returning phase
        // Only call once
        returnProgress.current = 1.5 // Lock to prevent re-calling

        // Calculate bounding box from stars with constellation positions only
        // This excludes unplaced stars that are still at far initial positions
        let minX = Infinity,
          maxX = -Infinity
        let minY = Infinity,
          maxY = -Infinity
        let minZ = Infinity,
          maxZ = -Infinity

        // Only include stars that have constellation positions
        let placedStarCount = 0
        starPositions.forEach((pos, index) => {
          const person = MOCK_PEOPLE[index]
          const starData = stars.get(person.id)
          // Only include if star has a constellation position (placed stars)
          if (starData?.constellationPosition) {
            minX = Math.min(minX, pos[0])
            maxX = Math.max(maxX, pos[0])
            minY = Math.min(minY, pos[1])
            maxY = Math.max(maxY, pos[1])
            minZ = Math.min(minZ, pos[2])
            maxZ = Math.max(maxZ, pos[2])
            placedStarCount++
          }
        })

        // If no stars placed yet, return to initial camera position
        if (placedStarCount === 0) {
          camera.position.set(0, 0, 25)
          camera.lookAt(0, 0, 0)
          onReturnComplete()
          return
        }

        // Use bounding box center for positioning
        const _centerX = (minX + maxX) / 2
        const _centerY = (minY + maxY) / 2
        const _centerZ = (minZ + maxZ) / 2

        // Store constellation center for OrbitControls
        constellationCenter.current.set(_centerX, _centerY, _centerZ)

        // Calculate size
        const width = maxX - minX
        const height = maxY - minY
        const depth = maxZ - minZ
        const maxDimension = Math.max(width, height, depth)

        // Calculate camera position based on actual viewport and HUD dimensions
        const viewportWidth = viewportDimensions.width
        const viewportHeight = viewportDimensions.height
        const isMobile = viewportWidth < 640

        // Measure actual DOM elements to match StarField.tsx
        const header =
          typeof window !== 'undefined'
            ? document.querySelector('h1')?.parentElement
            : null
        const headerRect = header?.getBoundingClientRect()
        const headerBottom = headerRect ? headerRect.bottom : 0

        const navPanel =
          typeof window !== 'undefined'
            ? document.getElementById('nav-panel')
            : null
        const navPanelRect = navPanel?.getBoundingClientRect()
        const navPanelTop = navPanelRect ? navPanelRect.top : viewportHeight

        // HUD dimensions (matches StarField.tsx)
        const hudHeight = isMobile
          ? Math.min(300, viewportHeight * 0.35)
          : Math.min(600, viewportHeight * 0.5)

        // Calculate available space and HUD position (matches StarField.tsx exactly)
        const navPanelHeight = viewportHeight - navPanelTop
        const availableSpace = viewportHeight - headerBottom - navPanelHeight
        const topPosition = headerBottom + (availableSpace - hudHeight) / 2

        // HUD center in screen space
        const hudCenterY = topPosition + hudHeight / 2
        const viewportCenterY = viewportHeight / 2
        const hudOffsetPx = hudCenterY - viewportCenterY

        const fovRadians = (60 * Math.PI) / 180

        // First calculate distance to fit constellation in HUD
        // Target: constellation fills 65% of HUD for good framing with extra margin
        const hudWidthPx = Math.min(900, viewportWidth * 0.8)
        const targetFillPercent = 0.65

        // Calculate distance needed to fit width and height separately, use the larger
        // FOV is vertical, need to calculate horizontal FOV based on aspect ratio
        const aspectRatio = viewportWidth / viewportHeight
        const horizontalFov =
          2 * Math.atan(Math.tan(fovRadians / 2) * aspectRatio)

        // Width: need to fit 'width' world units in hudWidthPx * 0.65
        const worldWidthAtDistance1 = 2 * Math.tan(horizontalFov / 2)
        const distanceForWidth =
          (width * viewportWidth) /
          (hudWidthPx * targetFillPercent * worldWidthAtDistance1)

        // Height: need to fit 'height' world units in hudHeight * 0.65
        const distanceForHeight =
          (height * viewportHeight) /
          (hudHeight * targetFillPercent * 2 * Math.tan(fovRadians / 2))

        // Use the larger distance to ensure both dimensions fit
        // Add 60% safety margin and account for depth to guarantee constellation stays within HUD
        const baseDistance =
          Math.max(distanceForWidth, distanceForHeight, depth * 2) * 1.6

        // Ensure minimum distance so all stars show as dots (distance > 40)
        const maxStarRadius = 10
        const minDistanceForPhotos = 40 + maxDimension / 2 + maxStarRadius
        const zDistance = Math.max(baseDistance, minDistanceForPhotos)

        // Now calculate yOffset using the calculated zDistance
        const worldHeightAtDistance = 2 * zDistance * Math.tan(fovRadians / 2)
        const pixelsToWorldUnits = worldHeightAtDistance / viewportHeight

        // Convert HUD offset to world space
        // Screen Y increases downward, World Y increases upward
        // If HUD is BELOW viewport center (positive offset), camera moves UP (positive Y)
        // to make stars appear higher on screen
        const adjustmentFactor = isMobile ? 1.3 : 1.15
        const yOffset = hudOffsetPx * pixelsToWorldUnits * adjustmentFactor

        // Position camera at constellation center with Y offset for HUD alignment
        // Camera is positioned far back on Z axis, looking at constellation center
        camera.position.set(_centerX, _centerY + yOffset, _centerZ + zDistance)
        camera.lookAt(_centerX, _centerY, _centerZ)
        
        // Save the final auto-pilot camera position for manual mode toggle
        // This prevents stars from jumping when user switches to manual mode
        autoPilotCameraPos.current.copy(camera.position)
        autoPilotCameraTarget.current.set(_centerX, _centerY, _centerZ)
        
        onReturnComplete()
      } else {
        // Animate return (progress < 1)
        returnProgress.current += 0.008 // Return speed
        returnProgress.current = Math.min(returnProgress.current, 1) // Cap at 1

        const t = returnProgress.current
        // Ease out for smooth deceleration
        const easedT = 1 - Math.pow(1 - t, 3)

        // Calculate bounding box from stars with constellation positions only (same as final position)
        let minX = Infinity,
          maxX = -Infinity
        let minY = Infinity,
          maxY = -Infinity
        let minZ = Infinity,
          maxZ = -Infinity

        // Only include stars that have constellation positions
        let placedStarCount = 0
        starPositions.forEach((pos, index) => {
          const person = MOCK_PEOPLE[index]
          const starData = stars.get(person.id)
          // Only include if star has a constellation position (placed stars)
          if (starData?.constellationPosition) {
            minX = Math.min(minX, pos[0])
            maxX = Math.max(maxX, pos[0])
            minY = Math.min(minY, pos[1])
            maxY = Math.max(maxY, pos[1])
            minZ = Math.min(minZ, pos[2])
            maxZ = Math.max(maxZ, pos[2])
            placedStarCount++
          }
        })

        // If no stars placed yet, return to initial camera position
        if (placedStarCount === 0) {
          const targetPos = new THREE.Vector3(0, 0, 25)
          const targetLookAt = new THREE.Vector3(0, 0, 0)
          camera.position.lerpVectors(returnStartPos.current, targetPos, easedT)
          camera.lookAt(targetLookAt)

          // Check if animation is complete
          if (easedT >= 0.99) {
            returnProgress.current = 1.5 // Lock to trigger completion block
          }
          return
        }

        // Use bounding box center for positioning
        const _centerX = (minX + maxX) / 2
        const _centerY = (minY + maxY) / 2
        const _centerZ = (minZ + maxZ) / 2

        // Calculate size
        const width = maxX - minX
        const height = maxY - minY
        const depth = maxZ - minZ
        const maxDimension = Math.max(width, height, depth)

        // Calculate camera position using same logic as final position
        const viewportWidth =
          typeof window !== 'undefined' ? window.innerWidth : 1024
        const viewportHeight =
          typeof window !== 'undefined' ? window.innerHeight : 768
        const isMobile = viewportWidth < 640

        const navPanelHeight = isMobile ? 200 : 250
        const hudHeightVh = isMobile ? 35 : 50
        const hudHeightPx = (viewportHeight * hudHeightVh) / 100

        const fovRadians = (60 * Math.PI) / 180

        const hudWidthPx = Math.min(900, viewportWidth * 0.8)
        const targetFillPercent = 0.65

        // Calculate distance needed to fit width and height separately, use the larger
        const aspectRatio = viewportWidth / viewportHeight
        const horizontalFov =
          2 * Math.atan(Math.tan(fovRadians / 2) * aspectRatio)

        const worldWidthAtDistance1 = 2 * Math.tan(horizontalFov / 2)
        const distanceForWidth =
          (width * viewportWidth) /
          (hudWidthPx * targetFillPercent * worldWidthAtDistance1)
        const distanceForHeight =
          (height * viewportHeight) /
          (hudHeightPx * targetFillPercent * 2 * Math.tan(fovRadians / 2))
        // Add 60% safety margin and account for depth to guarantee constellation stays within HUD
        const baseDistance =
          Math.max(distanceForWidth, distanceForHeight, depth * 2) * 1.6
        const maxStarRadius = 10
        const minDistanceForPhotos = 40 + maxDimension / 2 + maxStarRadius
        const zDistance = Math.max(baseDistance, minDistanceForPhotos)

        const worldHeightAtDistance = 2 * zDistance * Math.tan(fovRadians / 2)
        const pixelsToWorldUnits = worldHeightAtDistance / viewportHeight
        const offsetMultiplier = isMobile ? 1.5 : 1.0
        const yOffset =
          (navPanelHeight / 2) * pixelsToWorldUnits * offsetMultiplier

        const targetPos = new THREE.Vector3(
          _centerX,
          _centerY + yOffset,
          _centerZ + zDistance,
        )
        const targetLookAt = new THREE.Vector3(
          _centerX,
          _centerY,
          _centerZ,
        )

        // Interpolate position
        camera.position.lerpVectors(returnStartPos.current, targetPos, easedT)

        // Interpolate look direction
        const currentLookAt = new THREE.Vector3()
        camera.getWorldDirection(currentLookAt)
        currentLookAt.multiplyScalar(100).add(returnStartPos.current)
        const lookAtPoint = new THREE.Vector3().lerpVectors(
          currentLookAt,
          targetLookAt,
          easedT,
        )
        camera.lookAt(lookAtPoint)
      }
    }

    // Fly to target star (only after intro phase, not during takeoff)
    if (
      journeyPhase !== 'intro' &&
      journeyPhase !== 'takeoff' &&
      targetStarIndex >= 0 &&
      targetStarIndex < MOCK_PEOPLE.length
    ) {
      const targetPos = new THREE.Vector3(...starPositions[targetStarIndex])

      // Initialize flight path when starting new journey
      const currentDist = camera.position.distanceTo(targetPos)
      if (journeyPhase === 'flying' && !isFlying.current) {
        // Flight started - calculate target position ONCE at start
        isFlying.current = true
        flightProgress.current = 0
        hasTriggeredArrival.current = false // Reset arrival trigger
        hasTriggeredApproaching.current = false // Reset approaching trigger
        flightStartPos.current.copy(camera.position)

        // Store initial distance for speed normalization
        initialFlightDistance.current = currentDist

        // If NOT coming from takeoff, this is first flight from intro
        if (!cameFromTakeoff.current) {
          cameFromTakeoff.current = false // Will use constellation center as start lookAt
        }

        // Position camera straight-on to star for HUD centering
        const isMobile = viewportDimensions.width < 640
        const viewDistance = isMobile ? 5.5 : 6.5 // Mobile: farther for smaller appearance

        // Camera target position: directly in front of star
        targetPosition.current.set(
          targetPos.x,
          targetPos.y,
          targetPos.z + viewDistance,
        )

        // Smooth curved flight path
        if (cameFromTakeoff.current) {
          // After takeoff: camera is already off-center, create gentle curve toward target
          // Control point is midway between current position and target
          flightControlPoint.current.set(
            (camera.position.x + targetPos.x) / 2,
            (camera.position.y + targetPos.y) / 2,
            (camera.position.z + targetPosition.current.z) / 2,
          )
        } else {
          // First flight from intro: delayed panning
          // Control point stays near starting position for first half of flight
          const startWeight = 0.8 // Keep 80% of start position
          const targetWeight = 0.2 // Only 20% toward target

          flightControlPoint.current.set(
            camera.position.x * startWeight + targetPos.x * targetWeight,
            camera.position.y * startWeight + targetPos.y * targetWeight,
            camera.position.z * 0.3 + targetPosition.current.z * 0.7, // Move forward in Z
          )
        }
      }

      // Check distance to trigger "approaching" message (earlier now)
      if (
        currentDist < 20 &&
        !hasTriggeredApproaching.current &&
        journeyPhase === 'flying'
      ) {
        hasTriggeredApproaching.current = true
        onApproaching(MOCK_PEOPLE[targetStarIndex].name)
      }

      // Reset approaching trigger when moving to new star
      if (journeyPhase === 'flying' && currentDist > 25) {
        hasTriggeredApproaching.current = false
      }

      // Bezier curve flight path - continue even during 'arrived' to center the star
      if (
        isFlying.current &&
        (journeyPhase === 'flying' ||
          journeyPhase === 'approaching' ||
          journeyPhase === 'arrived')
      ) {
        // Variable speed: different behavior for first flight vs subsequent flights
        let baseSpeed

        if (initialFlightDistance.current > 40) {
          // First flight from intro - start fast, slow down as photos become visible
          baseSpeed =
            currentDist < 15
              ? 0.004 // Slow final approach
              : currentDist < 25
              ? 0.01 // Medium approach
              : currentDist < 50
              ? 0.02 // Fast when photos visible
              : 0.04 // Very fast when far away
        } else {
          // Subsequent flights between stars - faster speeds
          baseSpeed =
            currentDist < 15
              ? 0.006 // Final approach
              : currentDist < 25
              ? 0.015 // Approach speed
              : currentDist < 40
              ? 0.025 // Medium speed
              : 0.035 // Fast initial flight
        }

        flightProgress.current = Math.min(1, flightProgress.current + baseSpeed)

        // Auto-transition to 'arrived' when we get very close (only once)
        // Trigger after "approaching" phase: distance < 8 OR progress > 0.98
        if (
          (currentDist < 8 || flightProgress.current > 0.98) &&
          !hasTriggeredArrival.current
        ) {
          hasTriggeredArrival.current = true
          onArrived(MOCK_PEOPLE[targetStarIndex].name)
          // Don't stop flying yet - let it complete to center the star
        }

        // Stop flying when we've fully arrived
        if (flightProgress.current >= 1) {
          isFlying.current = false
        }

        // Linear progress - no easing for smooth consistent movement
        const t = flightProgress.current

        // Quadratic Bezier curve: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        const oneMinusT = 1 - t
        const newPos = new THREE.Vector3()
          .addScaledVector(flightStartPos.current, oneMinusT * oneMinusT)
          .addScaledVector(flightControlPoint.current, 2 * oneMinusT * t)
          .addScaledVector(targetPosition.current, t * t)

        camera.position.copy(newPos)

        // Gradually transition look direction with easing
        // If coming from takeoff, camera is already looking at target, so just continue
        // Otherwise (first flight from intro), start from constellation center
        // Delay the transition and use smooth easing
        const lookProgress = Math.max(0, (t - 0.2) / 0.8) // Start transitioning at t=0.2
        // Ease in-out: slow start, fast middle, slow end
        const easedLookProgress =
          lookProgress < 0.5
            ? 2 * lookProgress * lookProgress
            : 1 - Math.pow(-2 * lookProgress + 2, 2) / 2

        // Calculate final lookAt target with visual correction
        // Apply correction for all screen sizes, gradually blend in during second half of flight
        const visualCorrectionPx = -65
        const fovRadians = (60 * Math.PI) / 180
        const starDistance = 5.5
        const worldHeightAtStarDistance =
          2 * starDistance * Math.tan(fovRadians / 2)
        const pixelsToWorldUnits =
          worldHeightAtStarDistance / viewportDimensions.height
        const yAdjustment = visualCorrectionPx * pixelsToWorldUnits

        // Gradually blend from actual position to adjusted position during second half
        const adjustProgress = t > 0.5 ? (t - 0.5) / 0.5 : 0 // 0 at t=0.5, 1 at t=1
        const adjustedY = targetPos.y + yAdjustment * adjustProgress
        const finalTarget = new THREE.Vector3(
          targetPos.x,
          adjustedY,
          targetPos.z,
        )

        // Gradually transition look direction
        if (cameFromTakeoff.current) {
          // Coming from takeoff: gradually pan from takeoff end direction to centered on target
          const panProgress = Math.min(1, t * 1.5) // Complete pan by t=0.67
          const easedPanProgress =
            panProgress * panProgress * (3 - 2 * panProgress) // Smoothstep
          const lookAtPoint = new THREE.Vector3().lerpVectors(
            takeoffEndLookAt.current,
            finalTarget,
            easedPanProgress,
          )
          camera.lookAt(lookAtPoint)
        } else {
          // First flight from intro: interpolate from constellation center to target
          const startLookAt = new THREE.Vector3(0, -10, 0)
          const lookAtPoint = new THREE.Vector3().lerpVectors(
            startLookAt,
            finalTarget,
            easedLookProgress,
          )
          camera.lookAt(lookAtPoint)
        }

        // Complete flight when reached
        if (flightProgress.current >= 1) {
          isFlying.current = false

          // Apply visual correction to center star in HUD (same for all screen sizes)
          const visualCorrectionPx = -65
          const fovRadians = (60 * Math.PI) / 180
          const starDistance = 5.5
          const worldHeightAtStarDistance =
            2 * starDistance * Math.tan(fovRadians / 2)
          const pixelsToWorldUnits =
            worldHeightAtStarDistance / viewportDimensions.height
          const yAdjustment = visualCorrectionPx * pixelsToWorldUnits

          const finalLookAt = new THREE.Vector3(
            targetPos.x,
            targetPos.y + yAdjustment,
            targetPos.z,
          )

          camera.lookAt(finalLookAt)
          camera.rotation.z = 0 // Reset roll
        }
      } else if (journeyPhase !== 'flying' && journeyPhase !== 'approaching') {
        // Reset flight state when not flying
        isFlying.current = false
      }

      // Smooth camera look at target only during flight, not when arrived
      if (
        !isFlying.current &&
        currentDist > 0.1 &&
        journeyPhase !== 'arrived' &&
        journeyPhase !== 'placed' &&
        journeyPhase !== 'complete'
      ) {
        camera.lookAt(targetPos)
      }
    }

    // Find nearest star and calculate screen positions
    let minDist = Infinity
    let nearestId: string | null = null

    const overlays: StarOverlay[] = []

    MOCK_PEOPLE.forEach((person, index) => {
      const pos = new THREE.Vector3(...starPositions[index])
      const dist = camera.position.distanceTo(pos)

      if (dist < minDist) {
        minDist = dist
        nearestId = person.id
      }

      // Project 3D position to 2D screen coordinates
      const screenPos = pos.clone().project(camera)

      // Only show if star is in front of camera (not behind)
      // screenPos.z ranges from -1 (near) to 1 (far), negative means behind camera
      if (screenPos.z < 1) {
        const screenX = (screenPos.x * 0.5 + 0.5) * size.width
        const screenY = (-(screenPos.y * 0.5) + 0.5) * size.height

        overlays.push({
          person,
          screenX,
          screenY,
          distance: dist,
          isNear: nearestId === person.id,
        })
      }
    })

    // Only update state if nearest star changed to prevent unnecessary re-renders
    if (nearestId !== nearestStarId) {
      setNearestStarId(nearestId)
      // Only update overlays when nearest star changes to avoid constant re-renders
      onUpdateOverlays(overlays)
    }
  })

  return (
    <>
      {/* 3D HUD - follows camera */}
      <HUD3D />

      {/* Orbit controls - always present in returning phase, but only enabled in manual mode */}
      {journeyPhase === 'returning' && (
        <OrbitControls
          makeDefault={false}
          target={constellationCenter.current}
          enabled={manualControlsEnabled}
          enableZoom={manualControlsEnabled}
          enablePan={false}
          enableRotate={manualControlsEnabled}
          minDistance={30}
          maxDistance={100}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      )}

      {/* Ambient light */}
      <ambientLight intensity={0.3} />

      {/* Point light at camera position */}
      <pointLight position={[0, 0, 0]} intensity={1} />

      {/* Background stars */}
      <BackgroundStars />

      {/* Shooting stars - occasional cosmic magic */}
      <ShootingStar />
      <ShootingStar />

      {/* Constellation lines - only show in returning phase, only connect charted stars */}
      {journeyPhase === 'returning' && texturesLoaded && (
        <ConstellationLines
          positions={starPositions}
          placements={
            new Map(
              Array.from(stars.entries())
                .filter(([_, star]) => star.placement)
                .map(([id, star]) => [id, star.placement!]),
            )
          }
        />
      )}

      {/* Person stars - only render when all textures loaded */}
      {texturesLoaded &&
        MOCK_PEOPLE.map((person, index) => {
          // Check if this star is the current target
          // During takeoff: show previous star as target (we're backing away from it)
          // During flying/approaching/arrived/placed/complete: show current target
          const isTargetStar =
            (journeyPhase === 'takeoff' && index === previousStarIndex) ||
            (index === targetStarIndex &&
              (journeyPhase === 'flying' ||
                journeyPhase === 'approaching' ||
                journeyPhase === 'arrived' ||
                journeyPhase === 'placed' ||
                journeyPhase === 'complete'))

          const starData = stars.get(person.id)!

          return (
            <Star
              key={person.id}
              person={person}
              position={starPositions[index]}
              isTarget={isTargetStar}
              placement={starData.placement || undefined}
              texture={textures.get(person.id)!}
              journeyPhase={journeyPhase}
            />
          )
        })}

      {/* Flying controls removed - always auto-pilot */}
    </>
  )
}
