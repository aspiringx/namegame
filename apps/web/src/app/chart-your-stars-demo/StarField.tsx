'use client'

// Chart Your Stars - 3D star field with 2D overlay
import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Mock data for demo
// NOTE: WebP images don't load reliably in Three.js TextureLoader - using dicebear SVGs instead
// WebP paths for future (need conversion to JPG or different loading approach):
// Alice: '/uploads/user-photos/cmeg4p6r70002ihd1zt0im435.1757255300867.small.webp'
// Bob: '/uploads/user-photos/cmeg4pewy0000ihkwmy8voxi9.1759609763448.small.webp'
// Carol: '/uploads/user-photos/cmeg5liai0003ihzcqi2ppfwd.1755611564561.small.webp'
// David: '/uploads/user-photos/cmeimf6010005ygjemuhgjxqn.1755612613185.small.webp'

const MOCK_PEOPLE = [
  {
    id: '1',
    name: 'Alice Johnson',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Alice&size=256',
  },
  {
    id: '2',
    name: 'Bob Smith',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob&size=256',
  },
  {
    id: '3',
    name: 'Carol Williams',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Carol&size=256',
  },
  {
    id: '4',
    name: 'David Brown',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=David&size=256',
  },
  {
    id: '5',
    name: 'Eve Davis',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Eve&size=256',
  },
  {
    id: '6',
    name: 'Frank Miller',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Frank&size=256',
  },
  {
    id: '7',
    name: 'Grace Wilson',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Grace&size=256',
  },
  {
    id: '8',
    name: 'Henry Moore',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Henry&size=256',
  },
  {
    id: '9',
    name: 'Ivy Taylor',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Ivy&size=256',
  },
  {
    id: '10',
    name: 'Jack Anderson',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack&size=256',
  },
  {
    id: '11',
    name: 'Kate Thomas',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Kate&size=256',
  },
  {
    id: '12',
    name: 'Leo Jackson',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Leo&size=256',
  },
  {
    id: '13',
    name: 'Mia White',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Mia&size=256',
  },
  {
    id: '14',
    name: 'Noah Harris',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Noah&size=256',
  },
  {
    id: '15',
    name: 'Olivia Martin',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Olivia&size=256',
  },
  {
    id: '16',
    name: 'Paul Thompson',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Paul&size=256',
  },
  {
    id: '17',
    name: 'Quinn Garcia',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Quinn&size=256',
  },
  {
    id: '18',
    name: 'Rose Martinez',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Rose&size=256',
  },
  {
    id: '19',
    name: 'Sam Robinson',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sam&size=256',
  },
  {
    id: '20',
    name: 'Tina Clark',
    photo: 'https://api.dicebear.com/7.x/avataaars/png?seed=Tina&size=256',
  },
]

interface StarProps {
  person: (typeof MOCK_PEOPLE)[0]
  position: [number, number, number]
  isNear: boolean
  isTarget: boolean
  placement?: 'inner' | 'close' | 'outer'
  texture: THREE.Texture
  journeyPhase?: 'intro' | 'flying' | 'approaching' | 'arrived' | 'placed' | 'complete'
}

function Star({ position, isNear, isTarget, placement, texture, journeyPhase }: StarProps) {
  const spriteRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()

  // Simple billboard - always face camera (no rotation/banking that caused jumping)
  // For target star, face directly toward camera (perpendicular to camera direction)
  useFrame(() => {
    if (groupRef.current) {
      if (isTarget) {
        // Get camera's forward direction and make star perpendicular to it
        const cameraDirection = new THREE.Vector3()
        camera.getWorldDirection(cameraDirection)
        // Point star in opposite direction of camera (toward camera)
        const lookAtPos = groupRef.current.position.clone().sub(cameraDirection)
        groupRef.current.lookAt(lookAtPos)
      } else {
        groupRef.current.lookAt(camera.position)
      }
    }
  })

  // Size based on placement and target status
  // Sized to fit within HUD rectangle
  const baseSize = isTarget
    ? typeof window !== 'undefined' && window.innerWidth < 640 ? 1.8 : 3.0
    : placement === 'inner'
    ? 3.5
    : placement === 'close'
    ? 2.8
    : placement === 'outer'
    ? 2.2
    : 2.5 // Unrated: medium

  // Fade out non-target stars when arrived at target
  // Default 0.7 for depth/distance feel, 0.1 when arrived at another star
  const groupOpacity = isTarget ? 1.0 : (journeyPhase === 'arrived' ? 0.1 : 0.7)

  // Texture is preloaded and passed as prop - no need to load here

  // Custom shader material for circular clipping - must be before conditional return
  const circularMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        radius: { value: 0.5 }, // Clip to circle (0.5 = edge of sprite)
        opacity: { value: groupOpacity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float radius;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          if (dist > radius) discard;
          vec4 texColor = texture2D(map, vUv);
          gl_FragColor = vec4(texColor.rgb, texColor.a * opacity);
        }
      `,
      transparent: true,
    })
  }, [texture, groupOpacity])

  return (
    <group ref={groupRef} position={position}>
      {/* Opaque backing circle - blocks stars behind transparent areas */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[baseSize * 0.58, 64]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={groupOpacity} />
      </mesh>

      {/* Circular clipped image using mesh + custom shader */}
      <mesh
        ref={spriteRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[baseSize, baseSize]} />
        <primitive object={circularMaterial} attach="material" />
      </mesh>

      {/* White circular border ring - covers sprite edges */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[baseSize * 0.48, baseSize * 0.52, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={groupOpacity * (isTarget ? 1.0 : hovered ? 0.9 : 0.7)}
        />
      </mesh>

      {/* Cyan ring on target star - thinner, adjacent to white ring */}
      {isTarget && (
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[baseSize * 0.52, baseSize * 0.56, 64]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent={false}
            opacity={1.0}
          />
        </mesh>
      )}
    </group>
  )
}

// Shooting star component
function ShootingStar() {
  const ref = useRef<THREE.Points>(null)
  const [visible, setVisible] = useState(false)
  const startPos = useRef(new THREE.Vector3())
  const endPos = useRef(new THREE.Vector3())
  const progress = useRef(0)

  useEffect(() => {
    // Random interval between 8-20 seconds
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 12000
      setTimeout(() => {
        // Random start position at edge of view
        const angle = Math.random() * Math.PI * 2
        const radius = 100
        startPos.current.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          -50 + Math.random() * 100,
        )

        // Random end position on opposite side
        endPos.current.set(
          -startPos.current.x + (Math.random() - 0.5) * 50,
          -startPos.current.y + (Math.random() - 0.5) * 50,
          startPos.current.z + (Math.random() - 0.5) * 30,
        )

        progress.current = 0
        setVisible(true)
        scheduleNext()
      }, delay)
    }
    scheduleNext()
  }, [])

  // Create trail effect with multiple points - must be before conditional return
  const trailGeometry = useMemo(() => {
    const positions = new Float32Array(15) // 5 points for trail
    for (let i = 0; i < 5; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = -i * 0.5 // Trail behind
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    if (visible && ref.current) {
      progress.current += delta * 0.8 // Speed of shooting star

      if (progress.current >= 1) {
        setVisible(false)
        return
      }

      // Interpolate position
      const pos = new THREE.Vector3().lerpVectors(
        startPos.current,
        endPos.current,
        progress.current,
      )
      ref.current.position.copy(pos)

      // Fade in and out
      const opacity =
        progress.current < 0.1
          ? progress.current * 10
          : progress.current > 0.9
          ? (1 - progress.current) * 10
          : 1

      const material = ref.current.material as THREE.PointsMaterial
      material.opacity = opacity * 0.8
    }
  })

  if (!visible) return null

  return (
    <points ref={ref} geometry={trailGeometry}>
      <pointsMaterial
        size={0.3}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function BackgroundStars() {
  const { size } = useThree()

  // Responsive star count based on screen size
  const count = useMemo(() => {
    const area = size.width * size.height
    // Mobile (~400x800): ~200 stars, Desktop (~1920x1080): ~600 stars
    return Math.floor(Math.min(600, Math.max(200, area / 2000)))
  }, [size.width, size.height])

  const { positions, sizes, opacities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const starSizes = new Float32Array(count)
    const starOpacities = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Use spherical distribution to fill entire view uniformly
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 100 + Math.random() * 100 // Far behind constellation

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)

      // Much more visible sizes: 0.2 to 0.5
      starSizes[i] = 0.2 + Math.random() * 0.3

      // Much brighter: 0.7 to 1.0
      starOpacities[i] = 0.7 + Math.random() * 0.3
    }
    return { positions: pos, sizes: starSizes, opacities: starOpacities }
  }, [count])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))
    return geo
  }, [positions, sizes, opacities])

  // Responsive star size: larger on mobile, smaller on desktop
  const starSize = size.width < 768 ? 1.5 : 0.5

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={starSize}
        color="#ffffff"
        transparent
        opacity={1.0}
        sizeAttenuation={false}
        vertexColors={false}
      />
    </points>
  )
}

// FlyingControls removed - always auto-pilot mode

interface SceneProps {
  onUpdateOverlays: (overlays: StarOverlay[]) => void
  onSetSortedPeople: (
    people: Array<(typeof MOCK_PEOPLE)[0] & { originalIndex: number }>,
  ) => void
  targetStarIndex: number
  onApproaching: (personName: string) => void
  onArrived: (personName: string) => void
  journeyPhase:
    | 'intro'
    | 'flying'
    | 'approaching'
    | 'arrived'
    | 'placed'
    | 'complete'
  placements: Map<string, 'inner' | 'close' | 'outer'>
}

function Scene({
  onUpdateOverlays,
  onSetSortedPeople,
  targetStarIndex,
  onApproaching,
  onArrived,
  journeyPhase,
  placements,
}: SceneProps) {
  const { camera, size } = useThree()
  const [nearestStarId, setNearestStarId] = useState<string | null>(null)
  const [texturesLoaded, setTexturesLoaded] = useState(false)
  const targetPosition = useRef(new THREE.Vector3())
  const hasInitialized = useRef(false)
  const hasTriggeredApproaching = useRef(false)
  const hasTriggeredArrival = useRef(false)
  const flightProgress = useRef(0)
  const flightStartPos = useRef(new THREE.Vector3())
  const flightControlPoint = useRef(new THREE.Vector3())
  const isFlying = useRef(false)

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
          tex.needsUpdate = true
          loadedCount++
          if (loadedCount === MOCK_PEOPLE.length) {
            setTexturesLoaded(true)
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load ${person.name}:`, error)
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
  const gaussianRandom = (mean = 0, stdev = 1) => {
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z0 * stdev + mean
  }

  // Position stars in organic Gaussian cluster with minimum distance
  const starPositions = useMemo(() => {
    const positions: [number, number, number][] = []
    const minDistance = 20 // Minimum distance between stars to prevent overlap (accounting for scaling)
    const spread = 12 // Tighter spread so constellation fits in view
    const maxAttempts = 50 // Max attempts to find non-overlapping position

    for (let i = 0; i < MOCK_PEOPLE.length; i++) {
      let attempts = 0
      let validPosition = false
      let newPos: [number, number, number]

      while (!validPosition && attempts < maxAttempts) {
        newPos = [
          gaussianRandom(0, spread),
          gaussianRandom(0, spread * 0.8),
          gaussianRandom(0, spread * 0.7),
        ]

        // Check distance from all existing stars
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
    }

    return positions
  }, [])

  // Sort people by distance from starting camera position
  // This creates a visit order from closest to farthest
  useEffect(() => {
    const startPos = new THREE.Vector3(0, -10, 140)
    const sorted = MOCK_PEOPLE.map((person, index) => ({
      ...person,
      originalIndex: index,
      distance: startPos.distanceTo(new THREE.Vector3(...starPositions[index])),
    })).sort((a, b) => a.distance - b.distance)

    onSetSortedPeople(sorted)
  }, [starPositions, onSetSortedPeople])

  // Auto-pilot: initialize with overview, then move to target star
  useFrame(() => {
    // First time: set overview position
    if (!hasInitialized.current) {
      // Position camera further back to show all stars in HUD initially
      // Top UI is ~80px, nav panel is ~200px from bottom
      // Center point should be higher to account for nav panel taking more space
      camera.position.set(0, -10, 180) // Further back (z=180) to show all stars
      camera.lookAt(0, -10, 0) // Look at adjusted center
      hasInitialized.current = true
    }

    // Fly to target star (only after intro phase)
    if (
      journeyPhase !== 'intro' &&
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
        flightStartPos.current.copy(camera.position)

        // Position camera straight-on to star for HUD centering
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
        const viewDistance = isMobile ? 5.5 : 6.5 // Mobile: farther for smaller appearance
        
        // Camera position: directly in front of star along Z axis (straight view)
        // HUD now centered in viewport, so no Y offset needed
        targetPosition.current.set(
          targetPos.x, // X: same as star (horizontally centered)
          targetPos.y, // Y: same as star (vertically centered)
          targetPos.z + viewDistance // Z: in front of star
        )

        // Straight line flight - no curve, target stays centered
        flightControlPoint.current
          .copy(camera.position)
          .lerp(targetPosition.current, 0.5)
      }

      // Check distance to trigger "approaching" message
      if (
        currentDist < 15 &&
        !hasTriggeredApproaching.current &&
        journeyPhase === 'flying'
      ) {
        hasTriggeredApproaching.current = true
        onApproaching(MOCK_PEOPLE[targetStarIndex].name)
      }

      // Reset approaching trigger when moving to new star
      if (journeyPhase === 'flying' && currentDist > 20) {
        hasTriggeredApproaching.current = false
      }

      // Bezier curve flight path - continue even during 'arrived' to center the star
      if (
        isFlying.current &&
        (journeyPhase === 'flying' ||
          journeyPhase === 'approaching' ||
          journeyPhase === 'arrived')
      ) {
        // Constant speed - no easing to prevent any stuttering
        const baseSpeed = 0.006
        flightProgress.current = Math.min(
          1,
          flightProgress.current + baseSpeed,
        )

        // Auto-transition to 'arrived' when we get very close (only once)
        // Relaxed conditions: distance < 20 (was 14) and progress > 0.95 (was 0.98)
        if (
          currentDist < 20 &&
          flightProgress.current > 0.95 &&
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

        // Simple look at target instead
        camera.lookAt(targetPos)

        // Complete flight when reached
        if (flightProgress.current >= 1) {
          isFlying.current = false
          camera.lookAt(targetPos) // Final look at star
          camera.rotation.z = 0 // Reset roll
        }
      } else if (
        journeyPhase !== 'flying' &&
        journeyPhase !== 'approaching'
      ) {
        // Reset flight state when not flying
        isFlying.current = false
      }

      // Smooth camera look at target only during flight, not when arrived
      if (
        !isFlying.current &&
        currentDist > 0.1 &&
        journeyPhase !== 'arrived' &&
        journeyPhase !== 'placed'
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
      {/* Ambient light */}
      <ambientLight intensity={0.3} />

      {/* Point light at camera position */}
      <pointLight position={[0, 0, 0]} intensity={1} />

      {/* Background stars */}
      <BackgroundStars />

      {/* Shooting stars - occasional cosmic magic */}
      <ShootingStar />
      <ShootingStar />

      {/* Person stars - only render when all textures loaded */}
      {texturesLoaded &&
        MOCK_PEOPLE.map((person, index) => {
          // Check if this star is the current target - include 'arrived' so star stays large
          const isTargetStar =
            index === targetStarIndex &&
            (journeyPhase === 'flying' ||
              journeyPhase === 'approaching' ||
              journeyPhase === 'arrived')

          return (
            <Star
              key={person.id}
              person={person}
              position={starPositions[index]}
              isNear={nearestStarId === person.id}
              isTarget={isTargetStar}
              placement={placements.get(person.id)}
              texture={textures.get(person.id)!}
              journeyPhase={journeyPhase}
            />
          )
        })}

      {/* Flying controls removed - always auto-pilot */}
    </>
  )
}

interface StarOverlay {
  person: (typeof MOCK_PEOPLE)[0]
  screenX: number
  screenY: number
  distance: number
  isNear: boolean
}

// TODO: Future feature - relationship-based star positioning
// This will be used to reposition stars based on their assigned circle
// after the user has rated them. Closer relationships = closer/brighter stars.
const _getStarRadius = (placement?: 'inner' | 'close' | 'outer') => {
  if (!placement) return { min: 25, max: 35 } // Unrated - very far
  if (placement === 'inner') return { min: 5, max: 10 } // Inner circle - close
  if (placement === 'close') return { min: 10, max: 18 } // Close circle - mid
  return { min: 18, max: 25 } // Outer circle - far
}

export default function StarField() {
  const [overlays, setOverlays] = useState<StarOverlay[]>([])
  const [placements, setPlacements] = useState<
    Map<string, 'inner' | 'close' | 'outer'>
  >(new Map())
  const [currentStarIndex, setCurrentStarIndex] = useState(0)
  const [narratorMessage, setNarratorMessage] = useState<string>('')
  const [displayedMessage, setDisplayedMessage] = useState<string>('')
  const [journeyPhase, setJourneyPhase] = useState<
    'intro' | 'flying' | 'approaching' | 'arrived' | 'placed' | 'complete'
  >('intro')
  const [introStep, setIntroStep] = useState(0)
  // Sorted people array with their original indices - starts empty until Scene sorts them
  const [sortedPeople, setSortedPeople] = useState<
    Array<(typeof MOCK_PEOPLE)[0] & { originalIndex: number }>
  >([])

  // Show message instantly (typing effect removed)
  useEffect(() => {
    setDisplayedMessage(narratorMessage)
  }, [narratorMessage])

  // Intro sequence
  useEffect(() => {
    if (journeyPhase === 'intro') {
      // Multi-step intro messages
      const introMessages = [
        'Welcome to your your Demo star chart...',
        `There are ${MOCK_PEOPLE.length} stars, people in this constellation.`,
        "We'll visit each star so you can chart them based on your current relationship.",
        'Are you ready?',
      ]
      setNarratorMessage(introMessages[introStep])
    }
  }, [journeyPhase, introStep])

  const handleProceed = () => {
    if (journeyPhase === 'intro') {
      // Progress through intro steps
      if (introStep < 3) {
        setIntroStep(introStep + 1)
      } else {
        // Start the journey to first star (only if sortedPeople is ready)
        if (sortedPeople.length === 0) {
          console.warn('⚠️ sortedPeople not ready yet, waiting...')
          return
        }
        const firstPerson = sortedPeople[0]
        setNarratorMessage(`Let's begin! Flying to ${firstPerson.name}...`)
        setJourneyPhase('flying')
      }
    }
  }

  const handlePlacePerson = (
    person: (typeof MOCK_PEOPLE)[0],
    circle: 'inner' | 'close' | 'outer',
  ) => {
    setPlacements((prev) => new Map(prev).set(person.id, circle))

    // Check if this was the last person
    if (currentStarIndex >= sortedPeople.length - 1) {
      setNarratorMessage(
        `Journey complete! You've charted all ${MOCK_PEOPLE.length} stars in your constellation.`,
      )
      setJourneyPhase('complete')
    } else {
      // Move to next person
      const nextPerson = sortedPeople[currentStarIndex + 1]
      const circleLabel =
        circle === 'inner' ? 'Close' : circle === 'close' ? 'Near' : 'Distant'
      setNarratorMessage(
        `${person.name} placed as ${circleLabel}. Ready to visit ${nextPerson.name}?`,
      )
      setJourneyPhase('placed')
    }
  }

  const handleProceedAfterPlacement = () => {
    if (currentStarIndex < sortedPeople.length - 1) {
      const nextIndex = currentStarIndex + 1
      const nextPerson = sortedPeople[nextIndex]
      const distance = Math.floor(Math.random() * 20) + 5 // Random distance 5-25 light years
      setNarratorMessage(
        `Next up: ${nextPerson.name}, currently ${distance} light years away.`,
      )
      setCurrentStarIndex(nextIndex)
      setJourneyPhase('flying')
    } else {
      setNarratorMessage('Journey complete! All stars have been charted.')
      setJourneyPhase('complete')
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene
          onUpdateOverlays={setOverlays}
          onSetSortedPeople={setSortedPeople}
          targetStarIndex={sortedPeople[currentStarIndex]?.originalIndex ?? 0}
          onApproaching={(name) => {
            setNarratorMessage(`Approaching ${name}...`)
            setJourneyPhase('approaching')
          }}
          onArrived={(name) => {
            setNarratorMessage(
              `Arrived at ${name}! Mark their place in your star chart based on your current relationship.`,
            )
            setJourneyPhase('arrived')
          }}
          journeyPhase={journeyPhase}
          placements={placements}
        />
      </Canvas>

      {/* Spaceship HUD - Focus Rectangle with Corner Brackets */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="relative"
          style={{
            width: 'min(900px, 80vw)',
            height: typeof window !== 'undefined' && window.innerWidth < 640 
              ? 'min(300px, 35vh)' // Smaller on mobile to avoid nav panel overlap
              : 'min(600px, 50vh)', // Desktop size
          }}
        >
          {/* Top-left corner */}
          <div
            className="absolute left-0 top-0"
            style={{
              width: '40px',
              height: '40px',
              borderTop: '2px solid #00ff88',
              borderLeft: '2px solid #00ff88',
              boxShadow: '0 0 8px rgba(0, 255, 136, 0.4)',
            }}
          />
          {/* Top-right corner */}
          <div
            className="absolute right-0 top-0"
            style={{
              width: '40px',
              height: '40px',
              borderTop: '2px solid #00ff88',
              borderRight: '2px solid #00ff88',
              boxShadow: '0 0 8px rgba(0, 255, 136, 0.4)',
            }}
          />
          {/* Bottom-left corner */}
          <div
            className="absolute bottom-0 left-0"
            style={{
              width: '40px',
              height: '40px',
              borderBottom: '2px solid #00ff88',
              borderLeft: '2px solid #00ff88',
              boxShadow: '0 0 8px rgba(0, 255, 136, 0.4)',
            }}
          />
          {/* Bottom-right corner */}
          <div
            className="absolute bottom-0 right-0"
            style={{
              width: '40px',
              height: '40px',
              borderBottom: '2px solid #00ff88',
              borderRight: '2px solid #00ff88',
              boxShadow: '0 0 8px rgba(0, 255, 136, 0.4)',
            }}
          />

          {/* Center crosshair */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="absolute"
              style={{
                width: '20px',
                height: '2px',
                backgroundColor: '#00ff88',
                opacity: 0.1,
                left: '-10px',
              }}
            />
            <div
              className="absolute"
              style={{
                width: '2px',
                height: '20px',
                backgroundColor: '#00ff88',
                opacity: 0.1,
                top: '-10px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation System - Control Panel Style */}
      {narratorMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4">
          <div className="relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
            {/* Control panel accent lines */}
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
            <div className="absolute left-0 bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>
            <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-l from-indigo-500 via-cyan-400 to-indigo-500"></div>

            {/* Content */}
            <div className="relative px-4 py-3 sm:px-6 sm:py-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400/70">
                    Navigation System
                  </span>
                </div>
              </div>
              <p
                className="font-mono text-xs leading-relaxed tracking-wide text-indigo-100 sm:text-sm pt-2"
                style={{ letterSpacing: '0.03em' }}
              >
                {displayedMessage}
              </p>

              {/* Placement buttons - show when arrived at a star */}
              {journeyPhase === 'arrived' &&
                sortedPeople.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        handlePlacePerson(
                          sortedPeople[currentStarIndex],
                          'inner',
                        )
                      }
                      className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      Close
                    </button>
                    <button
                      onClick={() =>
                        handlePlacePerson(
                          sortedPeople[currentStarIndex],
                          'close',
                        )
                      }
                      className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      Near
                    </button>
                    <button
                      onClick={() =>
                        handlePlacePerson(
                          sortedPeople[currentStarIndex],
                          'outer',
                        )
                      }
                      className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      Distant
                    </button>
                  </div>
                )}

              {/* Proceed button - show when waiting for user to advance */}
              {(journeyPhase === 'intro' || journeyPhase === 'placed') && (
                  <button
                    onClick={
                      journeyPhase === 'placed'
                        ? handleProceedAfterPlacement
                        : handleProceed
                    }
                    className="mt-3 w-full rounded border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 font-mono text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                  >
                    → Proceed
                  </button>
                )}

              {/* Star counter footer */}
                <div className="mt-2 pt-1 pb-1 border-t border-indigo-500/30 text-center">
                  <span className="text-xs font-mono text-indigo-300">
                    {journeyPhase === 'intro'
                      ? `${MOCK_PEOPLE.length} stars detected`
                      : `Star ${currentStarIndex + 1} of ${MOCK_PEOPLE.length}`}
                  </span>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
