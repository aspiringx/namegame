import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { StarProps } from './types'

export default function Star({
  person,
  position,
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
      
      // Debug: Log Alice's actual rendered position during takeoff
      if (person.name === 'Alice Johnson' && journeyPhase === 'takeoff' && isTarget) {
        const worldPos = new THREE.Vector3()
        groupRef.current.getWorldPosition(worldPos)
        if (Math.random() < 0.1) { // Only log 10% of frames to avoid spam
          console.log('🎯 Alice world position:', worldPos.toArray().map(n => n.toFixed(1)), 'camera:', camera.position.toArray().map(n => n.toFixed(1)))
        }
      }

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
  // Lock appearance when in arrived/placed/takeoff/complete phase to prevent flickering
  const isLocked =
    isTarget &&
    (journeyPhase === 'arrived' ||
      journeyPhase === 'placed' ||
      journeyPhase === 'takeoff' ||
      journeyPhase === 'complete')
  const shouldResetLocks =
    isTarget && (journeyPhase === 'flying' || journeyPhase === 'approaching')

  // Reset locks when transitioning away from complete/placed to a new journey
  if (isTarget && journeyPhase === 'returning') {
    lockedSize.current = null
    lockedOpacity.current = null
    lockedTransitionProgress.current = null
  }

  // Calculate base size
  let baseSize = 2.5 // Default
  if (isTarget) {
    const calculatedSize =
      typeof window !== 'undefined' && window.innerWidth < 640 ? 1.8 : 3.0

    // During takeoff: gradually shrink based on distance as we pull back
    if (journeyPhase === 'takeoff') {
      const shrinkStart = 10 // Start shrinking after 10 units
      const shrinkEnd = 35 // Minimum size at 35 units (matches pullback)
      if (distanceToCamera < shrinkStart) {
        baseSize = calculatedSize
      } else if (distanceToCamera > shrinkEnd) {
        baseSize = calculatedSize * 0.4 // Shrink to 40% of original
      } else {
        // Gradual shrink from 100% to 40%
        const shrinkProgress =
          (distanceToCamera - shrinkStart) / (shrinkEnd - shrinkStart)
        baseSize = calculatedSize * (1.0 - shrinkProgress * 0.6)
      }
    } else if (isLocked) {
      // Lock size when arrived/placed - capture on first lock
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
    // Constellation stars (non-target) - boost size during intro and returning
    const isIntroPhase = journeyPhase === 'intro'
    const isFlying = journeyPhase === 'flying'
    const isReturning = journeyPhase === 'returning'
    const maxDist = 100
    const distanceFactor = Math.max(
      0,
      Math.min(1, 1 - distanceToCamera / maxDist),
    )

    if (isIntroPhase || isReturning) {
      // During intro: all stars visible and differentiated by placement
      // During returning: charted stars large, uncharted stars small/distant
      if (isIntroPhase) {
        const sizeMultiplier =
          placement === 'inner' ? 3.5 : placement === 'close' ? 2.8 : 2.2
        baseSize = sizeMultiplier
      } else {
        // Returning: differentiate charted vs uncharted
        if (placement) {
          // Charted stars: large and prominent, with clear size differences
          const sizeMultiplier =
            placement === 'inner' ? 4.5 : placement === 'close' ? 3.0 : 2.0
          baseSize = sizeMultiplier
        } else {
          // Uncharted stars: small and distant
          baseSize = 0.8
        }
      }
    } else if (isFlying && distanceToCamera < 40) {
      // During flying, if close (recently was target): use smaller size to match takeoff end
      // This prevents jump when transitioning from target to constellation
      const calculatedSize =
        typeof window !== 'undefined' && window.innerWidth < 640 ? 1.8 : 3.0
      baseSize = calculatedSize * 0.4 // Match the takeoff end size
    } else {
      // During journey: smaller to focus on target (1.5 to 3.0)
      baseSize = 1.5 + distanceFactor * 1.5
    }
  }

  // Distance thresholds for rendering
  const TRANSITION_START = 40 // Start showing image (was 60, now closer)
  const TRANSITION_END = 20 // Fully image (was 30, now closer)
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
    // During takeoff: gradually fade as camera zooms away
    if (journeyPhase === 'takeoff') {
      // Fade from 1.0 to 0.6 based on distance as we pull back
      const fadeStart = 10 // Start fading after 10 units
      const fadeEnd = 35 // Faded at 35 units (matches pullback)
      if (distanceToCamera < fadeStart) {
        groupOpacity = 1.0
      } else if (distanceToCamera > fadeEnd) {
        groupOpacity = 0.6 // End opacity after takeoff
      } else {
        // Gradual fade from 1.0 to 0.6
        const fadeProgress =
          (distanceToCamera - fadeStart) / (fadeEnd - fadeStart)
        groupOpacity = 1.0 - fadeProgress * 0.4
      }
    } else {
      // Other phases: use locked or calculated opacity
      const calculatedOpacity = 1.0

      if (isLocked) {
        // Lock opacity when arrived/placed - capture on first lock
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
    }
  } else {
    // Constellation stars (non-target) - boost visibility during intro and returning
    const isIntroPhase = journeyPhase === 'intro'
    const isFlying = journeyPhase === 'flying'
    const isReturning = journeyPhase === 'returning'

    // Opacity varies with distance
    const maxDist = 100
    const distanceFactor = Math.max(
      0,
      Math.min(1, 1 - distanceToCamera / maxDist),
    )

    if (isIntroPhase || isReturning) {
      // During intro: all stars visible and differentiated by placement
      // During returning: charted stars bright, uncharted stars dim
      if (isIntroPhase) {
        const baseBrightness =
          placement === 'inner' ? 1.0 : placement === 'close' ? 0.85 : 0.7
        groupOpacity = baseBrightness
      } else {
        // Returning: differentiate charted vs uncharted
        if (placement) {
          // Charted stars: bright and prominent, with clearer brightness differences
          const baseBrightness =
            placement === 'inner' ? 1.0 : placement === 'close' ? 0.75 : 0.5
          groupOpacity = baseBrightness
        } else {
          // Uncharted stars: visible but less prominent (match intro "Distant" brightness)
          groupOpacity = 0.7
        }
      }
    } else if (placement && journeyPhase === 'takeoff') {
      // SPECIAL CASE: Placed star during takeoff phase
      // This star was just placed and we're backing away from it
      // Use distance-based fade (same as target star takeoff logic)
      const fadeStart = 10
      const fadeEnd = 35
      if (distanceToCamera < fadeStart) {
        groupOpacity = 1.0
      } else if (distanceToCamera > fadeEnd) {
        groupOpacity = 0.6
      } else {
        const fadeProgress = (distanceToCamera - fadeStart) / (fadeEnd - fadeStart)
        groupOpacity = 1.0 - fadeProgress * 0.4
      }
    } else if (placement) {
      // Placed/charted stars: keep at fade-end opacity (matches takeoff end)
      groupOpacity = 0.6
    } else if (isFlying) {
      // Unplaced stars during flight: distance-based visibility
      if (distanceToCamera > 80) {
        // Unplaced stars far away: keep bright like intro
        groupOpacity = 0.9 + distanceFactor * 0.1
      } else if (distanceToCamera < 40) {
        // Unplaced stars nearby: moderate visibility
        groupOpacity = 0.6
      } else {
        // Unplaced stars mid-range: gradually dim (transition from 80 to 40)
        const transitionFactor = (distanceToCamera - 40) / 40
        const brightOpacity = 0.9 + distanceFactor * 0.1
        const dimOpacity = 0.3
        groupOpacity =
          dimOpacity + (brightOpacity - dimOpacity) * transitionFactor
      }
    } else {
      // Unplaced stars in other phases: dimmer to focus on target (0.15 to 0.7)
      groupOpacity = 0.15 + distanceFactor * 0.55
    }

    // Boost opacity during transition to image (only for unplaced stars)
    if (transitionProgress > 0 && !placement) {
      groupOpacity = Math.max(groupOpacity, 0.2 + transitionProgress * 0.5) // 0.2 to 0.7
    }

    // Dim unplaced stars when arrived/approaching/placed/takeoff to focus on target
    // But keep placed/charted stars visible
    if (
      !placement &&
      (journeyPhase === 'arrived' ||
        journeyPhase === 'approaching' ||
        journeyPhase === 'placed' ||
        journeyPhase === 'takeoff')
    ) {
      groupOpacity *= 0.15 // Reduce to 15% to minimize distraction from target
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
          // Scale the dimension that's smaller to fill the circle
          vec2 adjustedUv = vUv - 0.5; // Center at origin
          
          if (aspect > 1.0) {
            // Wider than tall: scale down width to fit
            adjustedUv.x /= aspect;
          } else {
            // Taller than wide: scale down height to fit
            adjustedUv.y *= aspect;
          }
          
          adjustedUv = adjustedUv + 0.5; // Move back to 0-1 range
          
          // Clamp to valid texture coordinates to avoid edge sampling
          adjustedUv = clamp(adjustedUv, 0.01, 0.99);
          
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
  // Render order priority (HIGHER = renders last = on top):
  // 1. Target star: 100 (always on top)
  // 2. Charted stars: 50 (in front of uncharted)
  // 3. Uncharted stars: 0 (behind charted)
  const isCharted = placement !== undefined
  const renderOrder = isTarget ? 100 : isCharted ? 50 : 0

  // Log Alice's state during key phases
  const prevPhase = useRef<string>('')
  useEffect(() => {
    if (person.name === 'Alice Johnson' && journeyPhase !== prevPhase.current) {
      prevPhase.current = journeyPhase || ''
      console.log('🌟 Alice:', {
        phase: journeyPhase,
        isTarget,
        placement,
        groupOpacity: groupOpacity.toFixed(2),
        starGlowOpacity: starGlowOpacity.toFixed(2),
        transitionProgress: transitionProgress.toFixed(2),
        baseSize: baseSize.toFixed(2),
        distanceToCamera: distanceToCamera.toFixed(1),
        renderOrder,
        position: position.map(n => n.toFixed(1))
      })
    }
  }, [person.name, placement, journeyPhase, groupOpacity, starGlowOpacity, isTarget, transitionProgress, baseSize, distanceToCamera, renderOrder, position])

  return (
    <group ref={groupRef} position={position}>
      {/* All child meshes inherit renderOrder from group */}
      {/* White star glow - visible when far, fades out as image appears */}
      {starGlowOpacity > 0 && (
        <>
          {/* Bright white star core with sphere-like shading */}
          <mesh position={[0, 0, -0.02]} renderOrder={renderOrder}>
            <circleGeometry args={[whiteCoreSize, 64]} />
            <primitive object={sphereShadingMaterial} attach="material" />
          </mesh>
          {/* Soft glow halo */}
          <mesh position={[0, 0, -0.02]} renderOrder={renderOrder}>
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
          <mesh position={[0, 0, -0.01]} renderOrder={renderOrder}>
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
            renderOrder={renderOrder}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <planeGeometry args={[baseSize, baseSize]} />
            <primitive object={circleMaterial} attach="material" />
          </mesh>

          {/* White circular border ring - covers sprite edges */}
          <mesh position={[0, 0, 0.01]} renderOrder={renderOrder}>
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

          {/* Cyan ring on target star */}
          {isTarget && (
            <mesh position={[0, 0, 0.02]} renderOrder={renderOrder}>
              <ringGeometry args={[baseSize * 0.54, baseSize * 0.58, 64]} />
              <meshBasicMaterial
                color="#00ffff"
                transparent
                opacity={groupOpacity * transitionProgress * 0.9}
              />
            </mesh>
          )}
        </>
      )}
    </group>
  )
}
