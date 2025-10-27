'use client'

// Chart Your Stars - 3D star field with 2D overlay
import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Mock data for demo
// Alice: '/uploads/user-photos/cmeg4p6r70002ihd1zt0im435.1757255300867.small.webp'
// Bob: '/uploads/user-photos/cmeg4pewy0000ihkwmy8voxi9.1759609763448.small.webp'
// Carol: '/uploads/user-photos/cmeg5liai0003ihzcqi2ppfwd.1755611564561.small.webp'
// David: '/uploads/user-photos/cmeimf6010005ygjemuhgjxqn.1755612613185.small.webp'

const MOCK_PEOPLE = [
  {
    id: '1',
    name: 'Alice Johnson',
    photo:
      '/uploads/user-photos/cmeg4p6r70002ihd1zt0im435.1757255300867.small.webp',
  },
  {
    id: '2',
    name: 'Bob Smith',
    photo:
      '/uploads/user-photos/cmeg4pewy0000ihkwmy8voxi9.1759609763448.small.webp',
  },
  {
    id: '3',
    name: 'Carol Williams',
    photo:
      '/uploads/user-photos/cmeg5liai0003ihzcqi2ppfwd.1755611564561.small.webp',
  },
  {
    id: '4',
    name: 'David Brown',
    photo:
      '/uploads/user-photos/cmeimf6010005ygjemuhgjxqn.1755612613185.small.webp',
  },
  {
    id: '5',
    name: 'Eve Davis',
    photo:
      '/uploads/user-photos/cmeimfkgh0007ygjez1dzqzra.1755612631924.small.webp',
  },
  {
    id: '6',
    name: 'Frank Miller',
    photo:
      '/uploads/user-photos/cmeq3icdd0000ihlv51grw0u6.1756070999426.small.webp',
  },
  {
    id: '7',
    name: 'Grace Wilson',
    photo:
      '/uploads/user-photos/cmf1ohc130000ih8v2rv0zyit.1756767781507.small.webp',
  },
  {
    id: '8',
    name: 'Henry Moore',
    photo:
      '/uploads/user-photos/cmf38lys60000ygbsiagl87us.1756862139772.small.webp',
  },
  {
    id: '9',
    name: 'Ivy Taylor',
    photo:
      '/uploads/user-photos/cmf4bgcuq0000ihvedptmog5d.1756924599827.small.webp',
  },
  {
    id: '10',
    name: 'Jack Anderson',
    photo:
      '/uploads/user-photos/cmf4cjck80001ihveagdtfgwj.1756929266277.small.webp',
  },
  {
    id: '11',
    name: 'Kate Thomas',
    photo:
      '/uploads/user-photos/cmf4ec9be0002ihvexjjta64v.1756929696290.small.webp',
  },
  {
    id: '12',
    name: 'Leo Jackson',
    photo:
      '/uploads/user-photos/cmf6yqezu000gihwhz2dx5uh6.1757277155522.small.webp',
  },
  {
    id: '13',
    name: 'Mia White',
    photo:
      '/uploads/user-photos/cmf7l2cf80002ihoj1s8hp7ng.1757122034525.small.webp',
  },
  {
    id: '14',
    name: 'Noah Harris',
    photo:
      '/uploads/user-photos/cmf9qeepp0000ih461yaqo00m.1757254714887.small.webp',
  },
  {
    id: '15',
    name: 'Olivia Martin',
    photo:
      '/uploads/user-photos/cmfekp7a00000ih9k0xg8j22p.1757680626180.small.webp',
  },
]

interface StarProps {
  person: (typeof MOCK_PEOPLE)[0]
  position: [number, number, number]
  isNear: boolean
  isTarget: boolean
  placement?: 'inner' | 'close' | 'outer'
  texture: THREE.Texture
  journeyPhase?:
    | 'intro'
    | 'flying'
    | 'approaching'
    | 'arrived'
    | 'placed'
    | 'takeoff'
    | 'complete'
}

function Star({
  position,
  isNear,
  isTarget,
  placement,
  texture,
  journeyPhase,
}: StarProps) {
  const spriteRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()
  const [distanceToCamera, setDistanceToCamera] = useState(0)
  const [fadeIn, setFadeIn] = useState(0)

  // Fade in animation on mount
  useEffect(() => {
    const startTime = Date.now()
    const duration = 1000 // 1 second fade in
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setFadeIn(progress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }, [])

  // Lock appearance when arrived to prevent flickering during UI interaction
  const lockedSize = useRef<number | null>(null)
  const lockedOpacity = useRef<number | null>(null)
  const lockedTransitionProgress = useRef<number | null>(null)

  // Calculate distance and billboard rotation
  useFrame(() => {
    if (groupRef.current) {
      // Update distance to camera
      const dist = camera.position.distanceTo(new THREE.Vector3(...position))
      setDistanceToCamera(dist)

      // Billboard - always face camera
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

  // Size based on distance for depth perception
  // Lock appearance when in arrived/placed/takeoff phase to prevent flickering
  const isLocked =
    isTarget &&
    (journeyPhase === 'arrived' ||
      journeyPhase === 'placed' ||
      journeyPhase === 'takeoff')
  const shouldResetLocks =
    isTarget && (journeyPhase === 'flying' || journeyPhase === 'approaching')

  // Calculate base size
  let baseSize = 2.5 // Default
  if (isTarget) {
    const calculatedSize =
      typeof window !== 'undefined' && window.innerWidth < 640 ? 1.8 : 3.0

    if (isLocked) {
      // Lock size when arrived/placed/takeoff - capture on first lock
      if (lockedSize.current === null) {
        lockedSize.current = calculatedSize
      }
      baseSize = lockedSize.current
    } else if (shouldResetLocks) {
      // Only reset lock when flying to next star
      lockedSize.current = null
      baseSize = calculatedSize
    } else {
      // Use calculated size during approach
      baseSize = calculatedSize
    }
  } else {
    // Constellation stars (non-target) - boost size during intro
    const isIntroPhase = journeyPhase === 'intro'
    const maxDist = 100
    const distanceFactor = Math.max(
      0,
      Math.min(1, 1 - distanceToCamera / maxDist),
    )

    if (isIntroPhase) {
      // During intro: larger and more visible (2.0 to 3.5)
      baseSize = 2.0 + distanceFactor * 1.5
    } else {
      // During journey: smaller to focus on target (1.5 to 3.0)
      baseSize = 1.5 + distanceFactor * 1.5
    }
  }

  // Distance thresholds for rendering
  const TRANSITION_START = 60 // Start showing image
  const TRANSITION_END = 30 // Fully image
  let transitionProgress = Math.max(
    0,
    Math.min(
      1,
      (TRANSITION_START - distanceToCamera) /
        (TRANSITION_START - TRANSITION_END),
    ),
  )

  // Lock transition progress when arrived/placed/takeoff
  if (isLocked) {
    if (lockedTransitionProgress.current === null) {
      lockedTransitionProgress.current = transitionProgress
    }
    transitionProgress = lockedTransitionProgress.current
  } else if (shouldResetLocks) {
    lockedTransitionProgress.current = null
  }

  // Force images hidden during intro phase to prevent flash
  const isIntroPhase = journeyPhase === 'intro'
  if (isIntroPhase) {
    transitionProgress = 0
  }

  // Calculate opacity based on distance for depth perception
  let groupOpacity = 1.0
  if (isTarget) {
    const calculatedOpacity = 1.0

    if (isLocked) {
      // Lock opacity when arrived/placed/takeoff - capture on first lock
      if (lockedOpacity.current === null) {
        lockedOpacity.current = calculatedOpacity
      }
      groupOpacity = lockedOpacity.current
    } else if (shouldResetLocks) {
      // Only reset lock when flying to next star
      lockedOpacity.current = null
      groupOpacity = calculatedOpacity
    } else {
      // Use calculated opacity during approach
      groupOpacity = calculatedOpacity
    }
  } else {
    // Constellation stars (non-target) - boost visibility during intro
    const isIntroPhase = journeyPhase === 'intro'

    // Opacity varies with distance
    const maxDist = 100
    const distanceFactor = Math.max(
      0,
      Math.min(1, 1 - distanceToCamera / maxDist),
    )

    if (isIntroPhase) {
      // During intro: very bright and visible (0.9 to 1.0)
      // Should be brighter than background stars to "pop" like Orion
      groupOpacity = 0.9 + distanceFactor * 0.1
    } else {
      // During journey: dimmer to focus on target (0.15 to 0.7)
      groupOpacity = 0.15 + distanceFactor * 0.55
    }

    // Boost opacity during transition to image
    if (transitionProgress > 0) {
      groupOpacity = Math.max(groupOpacity, 0.2 + transitionProgress * 0.5) // 0.2 to 0.7
    }

    // Dim further when arrived at another star, but keep distance variation
    if (journeyPhase === 'arrived') {
      groupOpacity *= 0.3 // Reduce to 30% but maintain relative differences
    }
  }
  
  // Apply fade-in animation
  groupOpacity *= fadeIn

  // Texture is preloaded and passed as prop - no need to load here

  // Custom shader for circular clipping with aspect ratio preservation
  const circleMaterial = useMemo(() => {
    // Calculate texture aspect ratio
    const textureAspect = texture.image
      ? texture.image.width / texture.image.height
      : 1.0

    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        opacity: { value: groupOpacity * transitionProgress },
        aspect: { value: textureAspect },
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
        uniform float opacity;
        uniform float aspect;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          
          // Circular clipping
          float dist = distance(vUv, center);
          if (dist > 0.5) discard;
          
          // Adjust UVs to preserve aspect ratio (cover the circle)
          vec2 adjustedUv = vUv;
          if (aspect > 1.0) {
            // Wider than tall: scale height
            adjustedUv.y = 0.5 + (vUv.y - 0.5) * aspect;
          } else {
            // Taller than wide: scale width
            adjustedUv.x = 0.5 + (vUv.x - 0.5) / aspect;
          }
          
          vec4 texColor = texture2D(map, adjustedUv);
          gl_FragColor = vec4(texColor.rgb, texColor.a * opacity);
        }
      `,
      transparent: true,
    })
  }, [texture, groupOpacity, transitionProgress])

  // Calculate star glow opacity (fades out as image fades in)
  // Completely hide star when fully transitioned to image
  const starGlowOpacity =
    transitionProgress >= 1 ? 0 : groupOpacity * (1 - transitionProgress)

  // White core size: starts at 0.25, expands to 0.5 as we approach
  // This fills the glow area before the face appears
  const whiteCoreSize = baseSize * (0.25 + transitionProgress * 0.25)

  // Sphere-like shading material for 3D effect when distant
  const sphereShadingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#ffffff') },
        opacity: { value: starGlowOpacity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          
          // Softer radial gradient for sphere effect (brighter overall)
          // Keep center bright, gentle falloff at edges
          float radialGradient = 1.0 - smoothstep(0.2, 0.5, dist);
          radialGradient = mix(0.85, 1.0, radialGradient); // Minimum 85% brightness
          
          // Very subtle lighting effect (top-left slightly brighter)
          vec2 lightDir = normalize(vec2(-0.3, 0.3));
          vec2 fromCenter = normalize(vUv - center);
          float lighting = max(0.0, dot(fromCenter, lightDir)) * 0.1 + 0.9;
          
          float finalBrightness = radialGradient * lighting;
          
          gl_FragColor = vec4(color * finalBrightness, opacity);
        }
      `,
      transparent: true,
    })
  }, [starGlowOpacity])

  // Render image and star together during transition
  return (
    <group ref={groupRef} position={position}>
      {/* White star glow - visible when far, fades out as image appears */}
      {starGlowOpacity > 0 && (
        <>
          {/* Bright white star core with sphere-like shading */}
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[whiteCoreSize, 64]} />
            <primitive object={sphereShadingMaterial} attach="material" />
          </mesh>
          {/* Soft glow halo */}
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[baseSize * 0.56, 64]} />
            <meshBasicMaterial
              color="#aaccff"
              transparent
              opacity={starGlowOpacity * 0.15}
            />
          </mesh>
        </>
      )}

      {/* Image - fades in during transition */}
      {transitionProgress > 0 && (
        <>
          {/* Opaque backing circle - blocks stars behind */}
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[baseSize * 0.58, 64]} />
            <meshBasicMaterial
              color="#1a1a2e"
              transparent
              opacity={groupOpacity * transitionProgress}
            />
          </mesh>

          {/* Circular image using plane + custom shader */}
          <mesh
            ref={spriteRef}
            position={[0, 0, 0]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <planeGeometry args={[baseSize, baseSize]} />
            <primitive object={circleMaterial} attach="material" />
          </mesh>

          {/* White circular border ring - covers sprite edges */}
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[baseSize * 0.48, baseSize * 0.52, 64]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={
                groupOpacity *
                transitionProgress *
                (isTarget ? 1.0 : hovered ? 0.9 : 0.7)
              }
            />
          </mesh>

          {/* Cyan ring on target star - thinner, adjacent to white ring */}
          {isTarget && (
            <mesh position={[0, 0, 0.01]}>
              <ringGeometry args={[baseSize * 0.52, baseSize * 0.56, 64]} />
              <meshBasicMaterial
                color="#00ffff"
                transparent
                opacity={transitionProgress}
              />
            </mesh>
          )}
        </>
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
  onTakeoffComplete: () => void
  journeyPhase:
    | 'intro'
    | 'flying'
    | 'approaching'
    | 'arrived'
    | 'placed'
    | 'takeoff'
    | 'complete'
  placements: Map<string, 'inner' | 'close' | 'outer'>
}

function Scene({
  onUpdateOverlays,
  onSetSortedPeople,
  targetStarIndex,
  onApproaching,
  onArrived,
  onTakeoffComplete,
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
  const takeoffProgress = useRef(0)
  const takeoffStartPos = useRef(new THREE.Vector3())
  const previousStarPos = useRef(new THREE.Vector3())
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

  // Initialize takeoff when phase changes to 'takeoff'
  useEffect(() => {
    if (journeyPhase === 'takeoff' && targetStarIndex >= 0) {
      // Store current camera position as takeoff start
      takeoffStartPos.current.copy(camera.position)
      // Store previous star position (the one we're leaving)
      if (targetStarIndex > 0) {
        const prevStarIndex = targetStarIndex - 1
        previousStarPos.current.copy(
          new THREE.Vector3(...starPositions[prevStarIndex]),
        )
      }
      takeoffProgress.current = 0
    }
  }, [journeyPhase, targetStarIndex, camera.position, starPositions])

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

    // Handle takeoff sequence (pull back from current star before flying to next)
    if (journeyPhase === 'takeoff') {
      takeoffProgress.current += 0.02 // Takeoff speed

      if (takeoffProgress.current >= 1) {
        // Takeoff complete, transition to flying
        takeoffProgress.current = 0
        onTakeoffComplete() // Trigger transition to flying phase
      } else {
        // Pull camera back along Z-axis from previous star
        const pullBackDistance = 15 // Units to pull back
        const newZ =
          takeoffStartPos.current.z + pullBackDistance * takeoffProgress.current
        camera.position.set(
          takeoffStartPos.current.x,
          takeoffStartPos.current.y,
          newZ,
        )
        // Keep looking at previous star as we pull back
        camera.lookAt(previousStarPos.current)
      }
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
        const isMobile =
          typeof window !== 'undefined' && window.innerWidth < 640
        const viewDistance = isMobile ? 5.5 : 6.5 // Mobile: farther for smaller appearance

        // Camera position: directly in front of star along Z axis (straight view)
        // HUD now centered in viewport, so no Y offset needed
        targetPosition.current.set(
          targetPos.x, // X: same as star (horizontally centered)
          targetPos.y, // Y: same as star (vertically centered)
          targetPos.z + viewDistance, // Z: in front of star
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
        // Variable speed: fast at start, slow way down when faces appear
        // Slow down significantly when distance < 60 (when images start appearing)
        const baseSpeed =
          currentDist < 60
            ? 0.001 // Very slow, majestic approach when faces visible
            : 0.01 // Fast initial flight

        flightProgress.current = Math.min(1, flightProgress.current + baseSpeed)

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
      } else if (journeyPhase !== 'flying' && journeyPhase !== 'approaching') {
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
          // Check if this star is the current target - include all active phases
          const isTargetStar =
            index === targetStarIndex &&
            (journeyPhase === 'flying' ||
              journeyPhase === 'approaching' ||
              journeyPhase === 'arrived' ||
              journeyPhase === 'placed' ||
              journeyPhase === 'takeoff')

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
    | 'intro'
    | 'flying'
    | 'approaching'
    | 'arrived'
    | 'placed'
    | 'takeoff'
    | 'complete'
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
        `Joe, welcome to the Tippetts Family constellation...`,
        `This cosmic formation has ${MOCK_PEOPLE.length} stars, each a current or potential relationship...`,
        `Your mission is to chart the location of each star in your universe as...`,
        `<i>Close</i>: family/close friend<br /><i>Near</i>: friend/acquaintance<br /><i>Distant</i>: someone you don't yet know`,
        'Are you ready?',
      ]
      setNarratorMessage(introMessages[introStep])
    }
  }, [journeyPhase, introStep])

  const handleBack = () => {
    if (journeyPhase === 'intro' && introStep > 0) {
      setIntroStep(introStep - 1)
    }
  }

  const handleProceed = () => {
    if (journeyPhase === 'intro') {
      // Progress through intro steps (0-4, total 5 messages)
      if (introStep < 4) {
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
        `Taking off... Next up: ${nextPerson.name}, currently ${distance} light years away.`,
      )
      setCurrentStarIndex(nextIndex)
      setJourneyPhase('takeoff') // Start with takeoff, will transition to flying
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
          onTakeoffComplete={() => {
            const nextPerson = sortedPeople[currentStarIndex]
            setNarratorMessage(`Flying to ${nextPerson.name}...`)
            setJourneyPhase('flying')
          }}
          journeyPhase={journeyPhase}
          placements={placements}
        />
      </Canvas>

      {/* Spaceship HUD - Focus Rectangle with Corner Brackets */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{
            width: 'min(900px, 80vw)',
            height:
              typeof window !== 'undefined' && window.innerWidth < 640
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
                dangerouslySetInnerHTML={{ __html: displayedMessage }}
              />

              {/* Placement buttons - show when arrived at a star */}
              {journeyPhase === 'arrived' && sortedPeople.length > 0 && (
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

              {/* Navigation buttons - show when waiting for user to advance */}
              {(journeyPhase === 'intro' || journeyPhase === 'placed') && (
                <div className="mt-3 flex gap-2">
                  {/* Back button - only show during intro if not on first step */}
                  {journeyPhase === 'intro' && introStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="rounded border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 font-mono text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                      title="Previous message"
                    >
                      ←
                    </button>
                  )}
                  {/* Proceed button */}
                  <button
                    onClick={
                      journeyPhase === 'placed'
                        ? handleProceedAfterPlacement
                        : handleProceed
                    }
                    className="flex-1 rounded border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 font-mono text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                  >
                    → Proceed
                  </button>
                </div>
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
