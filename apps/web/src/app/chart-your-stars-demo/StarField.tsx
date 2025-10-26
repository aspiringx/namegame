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
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
  },
  {
    id: '2',
    name: 'Bob Smith',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
  },
  {
    id: '3',
    name: 'Carol Williams',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
  },
  {
    id: '4',
    name: 'David Brown',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  },
  {
    id: '5',
    name: 'Eve Davis',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve',
  },
  {
    id: '6',
    name: 'Frank Miller',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank',
  },
  {
    id: '7',
    name: 'Grace Wilson',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace',
  },
  {
    id: '8',
    name: 'Henry Moore',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry',
  },
  {
    id: '9',
    name: 'Ivy Taylor',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy',
  },
  {
    id: '10',
    name: 'Jack Anderson',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  },
  {
    id: '11',
    name: 'Kate Thomas',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kate',
  },
  {
    id: '12',
    name: 'Leo Jackson',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  },
  {
    id: '13',
    name: 'Mia White',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  },
  {
    id: '14',
    name: 'Noah Harris',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
  },
  {
    id: '15',
    name: 'Olivia Martin',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
  },
  {
    id: '16',
    name: 'Paul Thompson',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paul',
  },
  {
    id: '17',
    name: 'Quinn Garcia',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn',
  },
  {
    id: '18',
    name: 'Rose Martinez',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rose',
  },
  {
    id: '19',
    name: 'Sam Robinson',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
  },
  {
    id: '20',
    name: 'Tina Clark',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tina',
  },
]

interface StarProps {
  person: (typeof MOCK_PEOPLE)[0]
  position: [number, number, number]
  isNear: boolean
  isTarget: boolean
  placement?: 'inner' | 'close' | 'outer'
}

function Star({ person, position, isNear, isTarget, placement }: StarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const avatarRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()

  // Size based on placement
  const baseSize = useRef(
    placement === 'inner'
      ? 1.0 + Math.random() * 0.2
      : placement === 'close'
      ? 0.7 + Math.random() * 0.2
      : placement === 'outer'
      ? 0.5 + Math.random() * 0.15
      : 0.4 + Math.random() * 0.8,
  )

  // Load texture once with proper settings for webp
  const [avatarTexture] = useState(() => {
    const loader = new THREE.TextureLoader()
    const texture = loader.load(
      person.photo,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        console.log(`✓ Texture loaded: ${person.name}`)
      },
      undefined,
      (error) => console.error(`✗ Texture failed for ${person.name}:`, error)
    )
    return texture
  })

  // Brightness multiplier based on placement
  const brightnessMultiplier =
    placement === 'inner'
      ? 1.3
      : placement === 'close'
      ? 1.1
      : placement === 'outer'
      ? 0.9
      : 1.0 // Unrated: normal

  // Star color based on placement
  const starColor =
    placement === 'inner'
      ? '#ffd700' // Gold for inner circle
      : placement === 'close'
      ? '#87ceeb' // Sky blue for close
      : placement === 'outer'
      ? '#b19cd9' // Lavender for outer
      : '#ffffff' // White for unrated


  // Calculate distance from camera for scaling and proximity detection
  useFrame(() => {
    if (meshRef.current) {
      const dist = camera.position.distanceTo(meshRef.current.position)
      // Scale based on distance - closer = bigger
      // Much more conservative scaling to prevent overlapping stars
      // Target star gets special treatment via isNear
      const baseScale = Math.max(0.3, Math.min(1.2, 15 / dist))
      // Boost target star slightly when near
      const scale = isNear ? Math.min(1.5, baseScale * 1.2) : baseScale
      meshRef.current.scale.setScalar(scale)

      // Update brightness based on distance - closer = brighter
      // Much more dramatic brightness for constellation stars: 0.5 to 2.5
      const brightness = Math.max(0.5, Math.min(2.5, 30 / dist))
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity =
        brightness * brightnessMultiplier * (hovered ? 1.2 : 1.0)

      // Fade in avatar as we approach - "man in the moon" effect
      if (avatarRef.current) {
        const avatarMaterial = avatarRef.current.material as THREE.MeshBasicMaterial
        // Start fading in at distance 20, fully visible at distance 8
        const avatarOpacity = Math.max(0, Math.min(1, (20 - dist) / 12))
        avatarMaterial.opacity = avatarOpacity
      }
    }

    // Billboard effect - make group face camera
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Outer white glow ring - always visible */}
      <mesh scale={2.2}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={hovered ? 0.4 : 0.2}
        />
      </mesh>

      {/* Mid glow - brighter as we approach */}
      <mesh scale={1.6}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color="#e0e7ff"
          transparent
          opacity={hovered ? 0.5 : 0.3}
        />
      </mesh>

      {/* Star sphere - white core */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[baseSize.current, 32, 32]} />
        <meshStandardMaterial
          color={starColor}
          emissive={isTarget ? '#00ffff' : starColor}
          emissiveIntensity={hovered ? 1.2 : 0.9}
        />
      </mesh>

      {/* Avatar in center - fades in as we approach */}
      <mesh ref={avatarRef} position={[0, 0, 0.01]}>
        <circleGeometry args={[baseSize.current * 0.7, 32]} />
        <meshBasicMaterial map={avatarTexture} transparent opacity={0} />
      </mesh>

      {/* Bright cyan ring on target star during flight */}
      {isTarget && (
        <mesh scale={baseSize.current * 3.2}>
          <ringGeometry args={[0.45, 0.5, 64]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Bright white ring on arrival - shows when very close */}
      {isNear && (
        <mesh scale={baseSize.current * 2.6}>
          <ringGeometry args={[0.48, 0.52, 64]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={Math.max(
              0,
              Math.min(
                1,
                (12 -
                  camera.position.distanceTo(new THREE.Vector3(...position))) /
                  4,
              ),
            )}
          />
        </mesh>
      )}

      {/* Names and buttons now rendered as 2D overlay outside Canvas */}
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

function FlyingControls() {
  const { camera, gl, raycaster, size } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const isDragging = useRef(false)
  const lastTouch = useRef({ x: 0, y: 0 })
  const touches = useRef<Map<number, { x: number; y: number }>>(new Map())

  useFrame(() => {
    // Apply velocity with damping
    camera.position.add(velocity.current)
    velocity.current.multiplyScalar(0.85) // Stronger damping for more control
  })

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true
      lastTouch.current = { x: e.clientX, y: e.clientY }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return

      const deltaX = e.clientX - lastTouch.current.x
      const deltaY = e.clientY - lastTouch.current.y

      // Convert screen movement to world movement
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
        camera.quaternion,
      )
      const up = new THREE.Vector3(0, 1, 0)

      // Add to velocity for momentum - reduced sensitivity
      velocity.current.add(right.multiplyScalar(-deltaX * 0.003))
      velocity.current.add(up.multiplyScalar(deltaY * 0.003))

      // Rotate camera based on drag - reduced sensitivity
      camera.rotation.y += deltaX * 0.002
      camera.rotation.x += deltaY * 0.002
      camera.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, camera.rotation.x),
      )

      lastTouch.current = { x: e.clientX, y: e.clientY }
    }

    const handlePointerUp = () => {
      isDragging.current = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Get mouse position in normalized device coordinates (-1 to +1)
      const mouse = new THREE.Vector2(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1,
      )

      // Create ray from camera through mouse position
      raycaster.setFromCamera(mouse, camera)
      const direction = raycaster.ray.direction.clone()

      // Zoom toward the point under the cursor - reduced speed
      const zoomSpeed = e.deltaY * -0.005
      velocity.current.add(direction.multiplyScalar(zoomSpeed))
    }

    const handleTouchStart = (e: TouchEvent) => {
      touches.current.clear()
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i]
        touches.current.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()

      if (e.touches.length === 2 && touches.current.size === 2) {
        // Pinch-to-zoom
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]

        const currentDist = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        )

        const prevTouch1 = touches.current.get(touch1.identifier)
        const prevTouch2 = touches.current.get(touch2.identifier)

        if (prevTouch1 && prevTouch2) {
          const prevDist = Math.hypot(
            prevTouch2.x - prevTouch1.x,
            prevTouch2.y - prevTouch1.y,
          )

          const delta = currentDist - prevDist

          // Get center point of pinch
          const centerX = (touch1.clientX + touch2.clientX) / 2
          const centerY = (touch1.clientY + touch2.clientY) / 2

          const mouse = new THREE.Vector2(
            (centerX / size.width) * 2 - 1,
            -(centerY / size.height) * 2 + 1,
          )

          raycaster.setFromCamera(mouse, camera)
          const direction = raycaster.ray.direction.clone()

          // Zoom toward pinch center - reduced speed
          velocity.current.add(direction.multiplyScalar(delta * -0.005))
        }

        // Update stored positions
        touches.current.set(touch1.identifier, {
          x: touch1.clientX,
          y: touch1.clientY,
        })
        touches.current.set(touch2.identifier, {
          x: touch2.clientX,
          y: touch2.clientY,
        })
      }
    }

    const handleTouchEnd = () => {
      touches.current.clear()
    }

    const canvas = gl.domElement
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [camera, gl, raycaster, size])

  return null
}

interface SceneProps {
  onUpdateOverlays: (overlays: StarOverlay[]) => void
  onSetSortedPeople: (people: Array<typeof MOCK_PEOPLE[0] & { originalIndex: number }>) => void
  autoPilotEnabled: boolean
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
  autoPilotEnabled,
  targetStarIndex,
  onApproaching,
  onArrived,
  journeyPhase,
  placements,
}: SceneProps) {
  const { camera, size } = useThree()
  const [nearestStarId, setNearestStarId] = useState<string | null>(null)
  const targetPosition = useRef(new THREE.Vector3())
  const hasInitialized = useRef(false)
  const hasTriggeredApproaching = useRef(false)
  const hasTriggeredArrival = useRef(false)
  const flightProgress = useRef(0)
  const flightStartPos = useRef(new THREE.Vector3())
  const flightControlPoint = useRef(new THREE.Vector3())
  const isFlying = useRef(false)

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
    if (autoPilotEnabled) {
      // First time in auto-pilot: set overview position
      if (!hasInitialized.current) {
        // Position camera to center constellation vertically
        // Top UI is ~80px, nav panel is ~200px from bottom
        // Center point should be higher to account for nav panel taking more space
        camera.position.set(0, -10, 140) // Shift down (y=-10) to center in visible area
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

        // Position camera at a good viewing distance from the star
        // Calculate direction FROM camera TO star
        const direction = new THREE.Vector3().subVectors(targetPos, camera.position).normalize()
        const viewDistance = 15 // Distance to fill HUD nicely without being too close
        targetPosition.current
          .copy(targetPos)
          .sub(direction.multiplyScalar(viewDistance))

        // Initialize flight path when starting new journey
        const currentDist = camera.position.distanceTo(targetPos)
        if (journeyPhase === 'flying' && !isFlying.current) {
          // Flight started
          isFlying.current = true
          flightProgress.current = 0
          hasTriggeredArrival.current = false // Reset arrival trigger
          flightStartPos.current.copy(camera.position)

          // Straight line flight - no curve, target stays centered
          flightControlPoint.current.copy(camera.position).lerp(targetPosition.current, 0.5)
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
          // Variable speed: fast when far, slow when near stars with faces
          // Slow down significantly when within 50 units of target (where avatars are visible)
          const progressSpeed = currentDist > 50 ? 0.005 : currentDist > 30 ? 0.002 : 0.001
          flightProgress.current = Math.min(
            1,
            flightProgress.current + progressSpeed,
          )

          // Auto-transition to 'arrived' when we get very close (only once)
          // Trigger later (distance < 14) to avoid premature arrival
          if (
            currentDist < 14 &&
            flightProgress.current > 0.98 &&
            !hasTriggeredArrival.current
          ) {
            console.log(
              `🎯 Arrival triggered: distance=${currentDist.toFixed(
                2,
              )}, progress=${flightProgress.current.toFixed(2)}`,
            )
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

          // Calculate tangent for smooth camera rotation
          const tangent = new THREE.Vector3()
            .addScaledVector(flightStartPos.current, -2 * oneMinusT)
            .addScaledVector(flightControlPoint.current, 2 * (1 - 2 * t))
            .addScaledVector(targetPosition.current, 2 * t)
            .normalize()

          // Look along flight path with slight banking
          const lookTarget = new THREE.Vector3()
            .copy(camera.position)
            .add(tangent.multiplyScalar(5))

          camera.lookAt(lookTarget)

          // Add subtle roll/banking during curve
          const rollAmount = Math.sin(t * Math.PI) * 0.1 // Max 0.1 radians
          camera.rotation.z = rollAmount

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
    } else {
      // Reset initialization when leaving auto-pilot
      hasInitialized.current = false
      hasTriggeredApproaching.current = false
      isFlying.current = false
      camera.rotation.z = 0 // Reset any roll
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

    setNearestStarId(nearestId)
    onUpdateOverlays(overlays)
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

      {/* Person stars */}
      {MOCK_PEOPLE.map((person, index) => {
        // Check if this star is the current target by comparing with the target's originalIndex
        const isTargetStar = index === targetStarIndex && (journeyPhase === 'flying' || journeyPhase === 'approaching')
        
        return (
          <Star
            key={person.id}
            person={person}
            position={starPositions[index]}
            isNear={nearestStarId === person.id}
            isTarget={isTargetStar}
            placement={placements.get(person.id)}
          />
        )
      })}

      {/* Flying controls - only in manual mode */}
      {!autoPilotEnabled && <FlyingControls />}
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

interface StarFieldProps {
  autoPilotEnabled: boolean
  onModeChange?: (isAutoPilot: boolean) => void
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

export default function StarField({
  autoPilotEnabled,
  onModeChange,
}: StarFieldProps) {
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
  const [sortedPeople, setSortedPeople] = useState<Array<typeof MOCK_PEOPLE[0] & { originalIndex: number }>>([])

  // Show message instantly (typing effect removed)
  useEffect(() => {
    setDisplayedMessage(narratorMessage)
  }, [narratorMessage])

  // Intro sequence for auto-pilot
  useEffect(() => {
    if (autoPilotEnabled && journeyPhase === 'intro') {
      // Multi-step intro messages
      const introMessages = [
        "Welcome to your universe. We're looking at your Demo constellation...",
        `You have ${MOCK_PEOPLE.length} stars to chart. Each represents someone in this constellation.`,
        "We'll visit each star and you'll place them in your circles: Close, Near, or Distant.",
        'Are you ready?',
      ]
      setNarratorMessage(introMessages[introStep])
  }
}, [autoPilotEnabled, journeyPhase, introStep])

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
  console.log(`Placing ${person.name} in ${circle} circle`)
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
          autoPilotEnabled={autoPilotEnabled}
          targetStarIndex={sortedPeople[currentStarIndex]?.originalIndex ?? 0}
          onApproaching={(name) => {
            setNarratorMessage(`Approaching ${name}...`)
            setJourneyPhase('approaching')
          }}
          onArrived={(name) => {
            setNarratorMessage(`Arrived at ${name}! Choose their circle.`)
            setJourneyPhase('arrived')
          }}
          journeyPhase={journeyPhase}
          placements={placements}
        />
      </Canvas>

      {/* Spaceship HUD - Focus Rectangle with Corner Brackets */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          paddingTop: '120px',
          paddingBottom: '280px',
        }}
      >
        <div
          className="relative"
          style={{
            width: 'min(600px, 80vw)',
            height: 'min(400px, 50vh)',
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

      {/* 2D Overlay removed - names now shown in Html component with avatar */}

      {/* Navigation System - Control Panel Style */}
      {((autoPilotEnabled && narratorMessage) || !autoPilotEnabled) && (
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
                    {autoPilotEnabled
                      ? 'Navigation System'
                      : 'Manual Navigator Mode'}
                  </span>
                </div>

                {/* Mode toggle buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onModeChange?.(true)}
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      autoPilotEnabled
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                    }`}
                    title="Auto-Pilot Mode"
                  ></button>
                  <button
                    onClick={() => onModeChange?.(false)}
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      !autoPilotEnabled
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                    }`}
                    title="Manual Mode"
                  ></button>
                </div>
              </div>
              <p
                className="font-mono text-xs leading-relaxed tracking-wide text-indigo-100 sm:text-sm pt-2"
                style={{ letterSpacing: '0.03em' }}
              >
                {autoPilotEnabled
                  ? displayedMessage
                  : "You're in charge captain! Use your mouse or touch to navigate."}
              </p>

              {/* Placement buttons - show when arrived at a star */}
              {autoPilotEnabled && journeyPhase === 'arrived' && sortedPeople.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      handlePlacePerson(sortedPeople[currentStarIndex], 'inner')
                    }
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() =>
                      handlePlacePerson(sortedPeople[currentStarIndex], 'close')
                    }
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Near
                  </button>
                  <button
                    onClick={() =>
                      handlePlacePerson(sortedPeople[currentStarIndex], 'outer')
                    }
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Distant
                  </button>
                </div>
              )}

              {/* Proceed button - only show in auto-pilot when waiting for user to advance */}
              {autoPilotEnabled &&
                (journeyPhase === 'intro' || journeyPhase === 'placed') && (
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
              {autoPilotEnabled && (
                <div className="mt-2 pt-1 pb-1 border-t border-indigo-500/30 text-center">
                  <span className="text-xs font-mono text-indigo-300">
                    {journeyPhase === 'intro'
                      ? `${MOCK_PEOPLE.length} stars detected`
                      : `Star ${currentStarIndex + 1} of ${MOCK_PEOPLE.length}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
