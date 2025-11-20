import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { StarData, JourneyPhase, Person } from './types'
import { MOCK_PEOPLE } from './mockData'
import { getStarRadius } from './starData'
import Star from './Star'
import BackgroundStars from './BackgroundStars'
import ShootingStar from './ShootingStar'
import { ConstellationLines } from './ConstellationLines'
import HUD3D from './HUD3D'
import { useCameraPositioning } from './hooks/useCameraPositioning'
import { useManualCamera } from './hooks/useManualCamera'

interface SceneProps {
  stars: Map<string, StarData>
  onUpdateStars: (
    updater: (prev: Map<string, StarData>) => Map<string, StarData>,
  ) => void
  targetStarIndex: number
  previousStarIndex: number
  onApproaching: (personName: string) => void
  onArrived: (personName: string) => void
  onTakeoffComplete: () => void
  onReturnComplete: () => void
  journeyPhase: JourneyPhase
  useConstellationPositions: boolean
  viewportDimensions: { width: number; height: number }
  layoutMeasurements: { headerHeight: number; navPanelHeight: number }
  manualControlsEnabled: boolean
  shouldResetCameraRef: React.MutableRefObject<boolean>
  people?: Person[]
}

export default function Scene({
  stars,
  onUpdateStars,
  targetStarIndex,
  previousStarIndex,
  onApproaching,
  onArrived,
  onTakeoffComplete,
  onReturnComplete,
  journeyPhase,
  useConstellationPositions,
  viewportDimensions,
  layoutMeasurements,
  manualControlsEnabled,
  shouldResetCameraRef,
  people = MOCK_PEOPLE,
}: SceneProps) {
  const { camera } = useThree()
  const { calculateSphericalForConstellation } = useCameraPositioning()
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
  const constellationCenter = useRef(new THREE.Vector3(0, 0, 0)) // Offset lookAt point
  const geometricCenter = useRef(new THREE.Vector3(0, 0, 0)) // Actual center for orbiting
  const autoPilotCameraPos = useRef(new THREE.Vector3())
  const autoPilotCameraTarget = useRef(new THREE.Vector3())
  const autoPilotCameraQuaternion = useRef(new THREE.Quaternion())
  const hudOffsetY = useRef(0) // Y offset to apply for HUD centering
  const previousManualControlsEnabled = useRef(manualControlsEnabled)
  const initialPositionsGenerated = useRef(false)
  const lastTargetStarIndex = useRef(-1)
  const manualControlsEnabledRef = useRef(manualControlsEnabled)
  const cameraSpherical = useRef({ radius: 50, theta: 0, phi: Math.PI / 2 })

  // Update ref on every render so useFrame has current value
  manualControlsEnabledRef.current = manualControlsEnabled

  // Manual camera controls hook
  const { updateCamera: updateManualCamera } = useManualCamera({
    enabled: manualControlsEnabled,
    journeyPhase,
    cameraSpherical,
    autoPilotCameraTarget,
  })

  // Helper function to get thumbnail-sized photo URL for better performance
  const getPhotoUrlForSize = (
    photoUrl: string,
    size: 'thumb' | 'small' = 'thumb',
  ): string => {
    if (!photoUrl || photoUrl.includes('default-avatar')) {
      return photoUrl
    }

    // If it's an external URL (http/https), return as-is
    if (photoUrl.startsWith('http')) {
      return photoUrl
    }

    // Replace existing size suffix with desired size
    // Pattern: .{timestamp}.{size}.webp or .{timestamp}.webp
    const sizePattern = /\.(thumb|small|medium|large)\.webp$/
    if (sizePattern.test(photoUrl)) {
      // Already has a size, replace it
      return photoUrl.replace(sizePattern, `.${size}.webp`)
    }

    // No size suffix yet, insert before .webp
    if (photoUrl.endsWith('.webp')) {
      return photoUrl.replace(/\.webp$/, `.${size}.webp`)
    }

    // Try other common extensions
    const match = photoUrl.match(/\.(jpg|jpeg|png)$/i)
    if (match) {
      return photoUrl.replace(match[0], `.${size}${match[0]}`)
    }

    // Fallback: return original URL
    console.warn('Could not transform photo URL for size:', photoUrl)
    return photoUrl
  }

  // Preload textures - thumb for distant stars, small for close-up hero star
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const thumbTextureMap = new Map<string, THREE.Texture>()
    const smallTextureMap = new Map<string, THREE.Texture>()
    let loadedCount = 0
    const totalToLoad = people.length * 2 // Both thumb and small for each person

    const configureTexture = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.needsUpdate = true
    }

    people.forEach((person) => {
      // Load thumb texture for distant view
      const thumbUrl = getPhotoUrlForSize(person.photo, 'thumb')
      const thumbTexture = loader.load(
        thumbUrl,
        (tex) => {
          configureTexture(tex)
          loadedCount++
          if (loadedCount === totalToLoad) {
            setTexturesLoaded(true)
          }
        },
        undefined,
        (_error) => {
          loadedCount++
          if (loadedCount === totalToLoad) {
            setTexturesLoaded(true)
          }
        },
      )
      thumbTextureMap.set(person.id, thumbTexture)

      // Load small texture for close-up view
      const smallUrl = getPhotoUrlForSize(person.photo, 'small')
      const smallTexture = loader.load(
        smallUrl,
        (tex) => {
          configureTexture(tex)
          loadedCount++
          if (loadedCount === totalToLoad) {
            setTexturesLoaded(true)
          }
        },
        undefined,
        (_error) => {
          loadedCount++
          if (loadedCount === totalToLoad) {
            setTexturesLoaded(true)
          }
        },
      )
      smallTextureMap.set(person.id, smallTexture)
    })

    return { thumb: thumbTextureMap, small: smallTextureMap }
  }, [people])

  // Cleanup textures on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      textures.thumb.forEach((texture) => {
        texture.dispose()
      })
      textures.small.forEach((texture) => {
        texture.dispose()
      })
    }
  }, [textures])

  // Gaussian random helper for organic clustering
  const _gaussianRandom = (mean = 0, stdev = 1) => {
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z0 * stdev + mean
  }

  // Generate positions if they don't exist yet
  useEffect(() => {
    // Only generate initial positions once on mount
    if (!initialPositionsGenerated.current) {
      initialPositionsGenerated.current = true

      onUpdateStars((prevStars) => {
        const starsArray = Array.from(prevStars.values())
        const needsInitialPositions = starsArray.some((s) => !s.initialPosition)

        if (!needsInitialPositions) return prevStars

        const newStars = new Map(prevStars)
        const positions: [number, number, number][] = []
        const minDistance = 15
        const maxAttempts = 50

        people.forEach((person) => {
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
        })

        return newStars
      })
    }
  }, [onUpdateStars])

  // Generate constellation positions when user places stars
  useEffect(() => {
    if (!useConstellationPositions) return

    onUpdateStars((prevStars) => {
      const starsArray = Array.from(prevStars.values())
      const needsConstellationPositions = starsArray.some(
        (s) => s.placement && !s.constellationPosition,
      )

      if (!needsConstellationPositions) return prevStars

      const newStars = new Map(prevStars)

      people.forEach((person) => {
        const starData = newStars.get(person.id)!

        // Generate constellation position if placed and missing
        if (starData.placement && !starData.constellationPosition) {
          const { min, max } = getStarRadius(starData.placement)

          // Z-depth ranges: closer stars have higher z-values (toward camera)
          const getZRange = (placement: 'inner' | 'close' | 'outer') => {
            if (placement === 'inner') return { min: 8, max: 12 } // Closest to camera
            if (placement === 'close') return { min: 3, max: 7 } // Middle depth
            return { min: -2, max: 2 } // Farthest from camera
          }

          const zRange = getZRange(starData.placement)

          // Collect existing constellation positions to avoid clustering
          const existingPositions: [number, number, number][] = []
          newStars.forEach((star) => {
            if (star.constellationPosition) {
              existingPositions.push(star.constellationPosition)
            }
          })

          // Try to find a position with good spacing (minimum 6 units apart)
          const minDistance = 6
          let constellationPos: [number, number, number] | null = null
          let attempts = 0
          const maxAttempts = 50

          while (!constellationPos && attempts < maxAttempts) {
            attempts++

            const theta = Math.random() * Math.PI * 2
            const xyRadius = min + Math.random() * (max - min)
            const zPosition =
              zRange.min + Math.random() * (zRange.max - zRange.min)

            const candidate: [number, number, number] = [
              xyRadius * Math.cos(theta),
              xyRadius * Math.sin(theta),
              zPosition,
            ]

            // Check distance to all existing positions
            let tooClose = false
            for (const existing of existingPositions) {
              const dx = candidate[0] - existing[0]
              const dy = candidate[1] - existing[1]
              const dz = candidate[2] - existing[2]
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

              if (distance < minDistance) {
                tooClose = true
                break
              }
            }

            if (!tooClose) {
              constellationPos = candidate
            }
          }

          // Fallback: if we couldn't find a good position after max attempts, use last candidate
          if (!constellationPos) {
            const theta = Math.random() * Math.PI * 2
            const xyRadius = min + Math.random() * (max - min)
            const zPosition =
              zRange.min + Math.random() * (zRange.max - zRange.min)
            constellationPos = [
              xyRadius * Math.cos(theta),
              xyRadius * Math.sin(theta),
              zPosition,
            ]
          }

          newStars.set(person.id, {
            ...starData,
            constellationPosition: constellationPos,
          })
        }
      })

      // Calculate center Y of all constellation positions
      const constellationPositions: [number, number, number][] = []
      newStars.forEach((star) => {
        if (star.constellationPosition) {
          constellationPositions.push(star.constellationPosition)
        }
      })

      if (constellationPositions.length > 0) {
        // Calculate center in X and Y
        const centerX =
          constellationPositions.reduce((sum, pos) => sum + pos[0], 0) /
          constellationPositions.length
        const centerY =
          constellationPositions.reduce((sum, pos) => sum + pos[1], 0) /
          constellationPositions.length

        // Translate all positions so center is at (0, 0, z)
        newStars.forEach((star, id) => {
          if (star.constellationPosition) {
            const [x, y, z] = star.constellationPosition
            newStars.set(id, {
              ...star,
              constellationPosition: [x - centerX, y - centerY, z],
            })
          }
        })

        // Verify translation worked
        const translatedPositions: [number, number, number][] = []
        newStars.forEach((star) => {
          if (star.constellationPosition) {
            translatedPositions.push(star.constellationPosition)
          }
        })
      }

      return newStars
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useConstellationPositions])

  // Get current positions from StarData
  // During journey: ALWAYS use initialPosition
  // During constellation view: use constellationPosition if available
  const starPositions = useMemo(() => {
    const positions = people.map((person) => {
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
  }, [stars, useConstellationPositions, people])

  // Auto-pilot: initialize with overview, then move to target star
  useFrame((state) => {
    const frameId = state.clock.elapsedTime

    // Handle manual controls toggle
    if (manualControlsEnabled !== previousManualControlsEnabled.current) {
      if (!manualControlsEnabled) {
        // Switching FROM manual mode back to auto-pilot: restore saved camera state
        camera.position.copy(autoPilotCameraPos.current)
        camera.lookAt(autoPilotCameraTarget.current)
      }
      previousManualControlsEnabled.current = manualControlsEnabled
    }

    // First time: set overview position
    if (!hasInitialized.current && !manualControlsEnabledRef.current) {
      // Position camera further back to show all stars in HUD initially
      const isMobile = viewportDimensions.width < 640

      // Measure actual DOM elements to match StarField.tsx
      const header =
        typeof window !== 'undefined' ? document.querySelector('header') : null
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

      // Add adjustmentFactor to center initial cluster of primary stars in the
      // HUD. This accounts for the HUDs position above the viewport center.
      const adjustmentFactor = isMobile ? 1.5 : 3
      const yOffset = hudOffsetPx * pixelsToWorldUnits * adjustmentFactor

      camera.position.set(0, yOffset, zDistance)
      camera.lookAt(0, yOffset, 0)
      hasInitialized.current = true
    }

    // Handle takeoff sequence (pull back from current star before flying to next)
    if (
      journeyPhase === 'takeoff' &&
      previousStarIndex >= 0 &&
      previousStarIndex < people.length
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

        takeoffProgress.current += 0.04 // Takeoff speed
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

    // Check if we need to reset camera (signaled by state machine)
    if (
      shouldResetCameraRef.current &&
      (journeyPhase === 'returning' ||
        journeyPhase === 'returning-batch-complete' ||
        journeyPhase === 'returning-journey-complete')
    ) {
      returnProgress.current = 0
      shouldResetCameraRef.current = false
    }

    // Reset return progress when leaving constellation view
    if (
      journeyPhase !== 'returning' &&
      journeyPhase !== 'returning-batch-complete' &&
      journeyPhase !== 'returning-journey-complete' &&
      returnProgress.current > 0
    ) {
      returnProgress.current = 0
    }

    // Handle return to constellation view
    if (
      (journeyPhase === 'returning' ||
        journeyPhase === 'returning-batch-complete' ||
        journeyPhase === 'returning-journey-complete') &&
      !manualControlsEnabledRef.current
    ) {
      if (returnProgress.current === 0 || returnProgress.current >= 1.5) {
        // Initialize return flight
        returnStartPos.current.copy(camera.position)
        returnProgress.current = 0.001 // Start slightly above 0
      }

      // Only animate if not yet complete
      if (returnProgress.current >= 1 && returnProgress.current < 1.5) {
        // Return complete - stop animating but stay in returning phase
        // Only call once
        returnProgress.current = 1.5 // Lock to prevent re-calling

        // Use spherical camera positioning logic
        const sphericalPos = calculateSphericalForConstellation(
          stars,
          starPositions,
          viewportDimensions,
          layoutMeasurements,
        )

        if (!sphericalPos) {
          console.warn('Failed to calculate camera position')
          return
        }

        // Store spherical coordinates as source of truth
        cameraSpherical.current.radius = sphericalPos.radius
        cameraSpherical.current.theta = sphericalPos.theta
        cameraSpherical.current.phi = sphericalPos.phi
        autoPilotCameraTarget.current.copy(sphericalPos.target)

        // Compute Cartesian position from spherical for initial setup
        const { radius, theta, phi } = cameraSpherical.current
        const target = autoPilotCameraTarget.current

        camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta)
        camera.position.y = target.y + radius * Math.cos(phi)
        camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta)

        camera.lookAt(target.x, target.y, target.z)

        // Save centers (constellation stays at origin)
        constellationCenter.current.set(0, 0, 0)
        geometricCenter.current.set(0, 0, 0)

        // Save camera position AND quaternion for toggling to manual mode
        autoPilotCameraPos.current.copy(camera.position)
        autoPilotCameraQuaternion.current.copy(camera.quaternion)

        // Clear hudOffsetY since we're not using it for star positions
        hudOffsetY.current = 0

        onReturnComplete()
      } else if (returnProgress.current < 1) {
        // Animate return (progress < 1)
        returnProgress.current += 0.008 // Return speed
        returnProgress.current = Math.min(returnProgress.current, 1) // Cap at 1

        const t = returnProgress.current
        // Ease out for smooth deceleration
        const easedT = 1 - Math.pow(1 - t, 3)

        // Calculate target position using spherical coordinates
        const sphericalPos = calculateSphericalForConstellation(
          stars,
          starPositions,
          viewportDimensions,
          layoutMeasurements,
        )

        if (!sphericalPos) {
          // No stars placed yet
          const targetPos = new THREE.Vector3(0, 0, 25)
          const targetLookAt = new THREE.Vector3(0, 0, 0)
          camera.position.lerpVectors(returnStartPos.current, targetPos, easedT)
          camera.lookAt(targetLookAt)

          if (easedT >= 0.99) {
            returnProgress.current = 1.5
          }
          return
        }

        // Compute target Cartesian position from spherical
        const { radius, theta, phi } = sphericalPos
        const target = sphericalPos.target

        const targetPos = new THREE.Vector3(
          target.x + radius * Math.sin(phi) * Math.sin(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.cos(theta),
        )

        // Lerp camera position to target
        camera.position.lerpVectors(returnStartPos.current, targetPos, easedT)

        // Lerp lookAt direction
        const currentLookAt = new THREE.Vector3()
        camera.getWorldDirection(currentLookAt)
        currentLookAt.multiplyScalar(100).add(returnStartPos.current)
        const lookAtPoint = new THREE.Vector3().lerpVectors(
          currentLookAt,
          target,
          easedT,
        )
        camera.lookAt(lookAtPoint)
      }
    }

    // Apply manual camera controls when enabled
    if (
      (journeyPhase === 'returning' ||
        journeyPhase === 'returning-batch-complete' ||
        journeyPhase === 'returning-journey-complete') &&
      manualControlsEnabledRef.current
    ) {
      updateManualCamera()
      return
    }

    // Fly to target star (only after intro phase, not during takeoff)
    if (
      journeyPhase !== 'intro' &&
      journeyPhase !== 'takeoff' &&
      targetStarIndex >= 0 &&
      targetStarIndex < people.length
    ) {
      const targetPos = new THREE.Vector3(...starPositions[targetStarIndex])

      // Reset flight state when target changes (new star selected)
      if (targetStarIndex !== lastTargetStarIndex.current) {
        isFlying.current = false
        lastTargetStarIndex.current = targetStarIndex
      }

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

        const isMobile = viewportDimensions.width < 640
        // Size of arrived-at star in the HUD. Smaller number makes it bigger.
        const viewDistance = isMobile ? 4.5 : 6.5

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
        onApproaching(people[targetStarIndex].name)
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
        // Flight speed tiers based on distance to target star
        // (slower when closer for smooth arrival)
        let baseSpeed
        if (currentDist < 15) {
          baseSpeed = 0.05 // Final approach to star
        } else if (currentDist < 25) {
          baseSpeed = 0.06 // Approaching star
        } else if (currentDist < 40) {
          baseSpeed = 0.075 // Medium distance flight
        } else {
          baseSpeed = 0.105 // Far distance flight
        }

        // Slow down initial flight from intro (longer distance, more dramatic)
        if (initialFlightDistance.current > 40) {
          baseSpeed *= 0.7
        }

        flightProgress.current = Math.min(1, flightProgress.current + baseSpeed)

        // Auto-transition to 'arrived' when we get very close (only once)
        // Trigger after "approaching" phase: distance < 8 OR progress > 0.98
        if (
          (currentDist < 8 || flightProgress.current > 0.98) &&
          !hasTriggeredArrival.current
        ) {
          hasTriggeredArrival.current = true
          onArrived(people[targetStarIndex].name)
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
        // visualCorrectionPx vertically centers one star in the HUD.
        const isMobile = viewportDimensions.width < 640
        const visualCorrectionPx = isMobile ? -35 : -25

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
          // Use the same finalTarget from flight (already has correction applied)
          camera.lookAt(finalTarget)
          camera.rotation.z = 0 // Reset roll
        }
      } else if (journeyPhase !== 'flying' && journeyPhase !== 'approaching') {
        // Reset flight state when not flying
        isFlying.current = false
      }

      // Smooth camera look at target only during flight, not when arrived or returning
      if (
        !isFlying.current &&
        currentDist > 0.1 &&
        journeyPhase !== 'approaching' &&
        journeyPhase !== 'arrived' &&
        journeyPhase !== 'placed' &&
        journeyPhase !== 'complete' &&
        journeyPhase !== 'returning' && // Don't look at target star when viewing constellation
        journeyPhase !== 'returning-batch-complete' &&
        journeyPhase !== 'returning-journey-complete'
      ) {
        camera.lookAt(targetPos)
      }
    }

    // Skip overlay calculations when in manual mode to prevent flickering
    if (
      manualControlsEnabledRef.current &&
      (journeyPhase === 'returning' ||
        journeyPhase === 'returning-batch-complete' ||
        journeyPhase === 'returning-journey-complete')
    ) {
      return
    }

    // Find nearest star (used for highlighting in nav panel)
    let minDist = Infinity
    let nearestId: string | null = null

    people.forEach((person, index) => {
      const pos = new THREE.Vector3(...starPositions[index])
      const dist = camera.position.distanceTo(pos)

      if (dist < minDist) {
        minDist = dist
        nearestId = person.id
      }
    })

    // Only update state if nearest star changed to prevent unnecessary re-renders
    if (nearestId !== nearestStarId) {
      setNearestStarId(nearestId)
    }
  })

  return (
    <>
      {/* 3D HUD - follows camera */}
      <HUD3D />

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
      {(journeyPhase === 'returning' ||
        journeyPhase === 'returning-batch-complete' ||
        journeyPhase === 'returning-journey-complete') &&
        texturesLoaded && (
          <ConstellationLines
            positions={starPositions}
            placements={
              new Map(
                Array.from(stars.entries())
                  .filter(([_, star]) => star.placement)
                  .map(([id, star]) => [id, star.placement!]),
              )
            }
            people={people}
          />
        )}

      {/* Person stars - only render when all textures loaded */}
      {texturesLoaded &&
        people.map((person, index) => {
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

          // Use small texture for hero star (close-up), thumb for others (distant)
          const texture = isTargetStar
            ? textures.small.get(person.id)!
            : textures.thumb.get(person.id)!

          return (
            <Star
              key={person.id}
              person={person}
              position={starPositions[index]}
              isTarget={isTargetStar}
              placement={starData.placement || undefined}
              texture={texture}
              journeyPhase={journeyPhase}
            />
          )
        })}

      {/* Flying controls removed - always auto-pilot */}
    </>
  )
}
