import { useMemo, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PrimaryStarsProps {
  radius?: number
  count?: number
  size?: number
  opacity?: number
  xOffset?: number // Shift all stars by this amount on X axis
  yOffset?: number // Shift all stars by this amount on Y axis
  zOffset?: number // Shift all stars by this amount on Z axis
  seed?: number // Seed for deterministic random positions
  wavePhase?: number // 0-1 explosion effect (stars fly outward)
  onPositionsReady?: (positions: Float32Array) => void
}

export default function PrimaryStars({
  radius = 100,
  count = 15,
  size = 4.0,
  opacity = 1.0,
  xOffset = 0,
  yOffset = 0,
  zOffset = 0,
  seed = 12345,
  wavePhase = 0,
  onPositionsReady,
}: PrimaryStarsProps) {
  // Seeded random number generator for deterministic positions
  const seededRandom = (s: number) => {
    let seed = s
    return () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }
  // Load the size as `viewport` and gl for pixel ratio.
  const { size: viewport, gl } = useThree()

  // Responsive star count: 6 min, 15 max based on viewport width. i.e. screens
  // 2560 and larger will have 15 primary stars. Smaller screens will have
  // fewer down to 6 (mobile).
  const responsiveCount = useMemo(() => {
    const ratio = viewport.width / 2560 // 2560 is max desktop width
    const calculated = Math.round(ratio * count)
    return Math.min(Math.max(calculated, 6), count)
  }, [viewport.width, count])

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(responsiveCount * 3)
    const cols = new Float32Array(responsiveCount * 3)
    const starSizes = new Float32Array(responsiveCount)
    const random = seededRandom(seed)

    // Calculate frustum bounds at the radius distance
    const aspect = viewport.width / viewport.height
    const fov = 50 // From scene default
    const vFOV = (fov * Math.PI) / 180
    const frustumHeight = 2 * Math.tan(vFOV / 2) * radius
    const frustumWidth = frustumHeight * aspect

    for (let i = 0; i < responsiveCount; i++) {
      // Distribute stars across full visible viewport
      pos[i * 3] = (random() - 0.5) * frustumWidth + xOffset // X: full width + offset
      pos[i * 3 + 1] = (random() - 0.5) * frustumHeight + yOffset // Y: full height + offset
      pos[i * 3 + 2] = (random() - 0.5) * radius * 0.4 + zOffset // Z: depth variation + offset

      // Organic size variation (0.6x to 1.4x base size)
      const sizeMultiplier = 0.8 + random() * 0.6
      starSizes[i] = sizeMultiplier

      // Brightness variation (70-100%)
      const brightness = 0.7 + random() * 0.3

      // Color temperature variation
      const temp = random()
      if (temp > 0.7) {
        // Warmer stars (30% chance) - yellowish
        cols[i * 3] = brightness * 1.0
        cols[i * 3 + 1] = brightness * 0.95
        cols[i * 3 + 2] = brightness * 0.85
      } else if (temp < 0.3) {
        // Cooler stars (30% chance) - blueish
        cols[i * 3] = brightness * 0.85
        cols[i * 3 + 1] = brightness * 0.95
        cols[i * 3 + 2] = brightness * 1.0
      } else {
        // Neutral white (40% chance)
        cols[i * 3] = brightness
        cols[i * 3 + 1] = brightness
        cols[i * 3 + 2] = brightness
      }
    }
    return { positions: pos, colors: cols, sizes: starSizes }
  }, [
    responsiveCount,
    xOffset,
    yOffset,
    zOffset,
    radius,
    seed,
    viewport.width,
    viewport.height,
  ]) // Regenerate if these change

  // Notify parent of star positions
  useEffect(() => {
    if (onPositionsReady) {
      onPositionsReady(positions)
    }
  }, [positions, onPositionsReady])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, colors, sizes])

  // Create circular texture for stars with sharp gradient
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,1)') // Stay opaque until 70%
    gradient.addColorStop(0.9, 'rgba(255,255,255,0.6)') // Quick fade
    gradient.addColorStop(1, 'rgba(255,255,255,0)') // Transparent edge
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  // Smooth opacity animation
  const currentOpacity = useRef(0)
  const targetOpacity = useRef(opacity)

  // Store original positions and random explosion directions
  const originalPositions = useRef(positions.slice())
  const explosionDirections = useRef<Float32Array | null>(null)
  const explosionSpeeds = useRef<Float32Array | null>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const trailsRef = useRef<THREE.Group>(null)

  // Initialize random explosion directions (seeded for consistency)
  useEffect(() => {
    if (!explosionDirections.current) {
      const random = seededRandom(seed + 999) // Different seed for directions
      const dirs = new Float32Array(responsiveCount * 3)
      const speeds = new Float32Array(responsiveCount)
      
      for (let i = 0; i < responsiveCount; i++) {
        // Random direction vector
        const theta = random() * Math.PI * 2
        const phi = Math.acos(2 * random() - 1)
        
        dirs[i * 3] = Math.sin(phi) * Math.cos(theta)
        dirs[i * 3 + 1] = Math.sin(phi) * Math.sin(theta)
        dirs[i * 3 + 2] = Math.cos(phi)
        
        // Random speed multiplier (0.5 to 1.5)
        speeds[i] = 0.5 + random() * 1.0
      }
      
      explosionDirections.current = dirs
      explosionSpeeds.current = speeds
    }
  }, [responsiveCount, seed])

  useEffect(() => {
    // Update target when prop changes
    targetOpacity.current = opacity
    // Initial fade in
    if (currentOpacity.current === 0) {
      setTimeout(() => {
        targetOpacity.current = opacity
      }, 100)
    }
  }, [opacity])

  // Custom shader material to enable per-star size variation
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          baseSize: { value: size },
          pixelRatio: { value: gl.getPixelRatio() },
          map: { value: starTexture },
          opacity: { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float baseSize;
          uniform float pixelRatio;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = baseSize * size * pixelRatio;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          uniform float opacity;
          varying vec3 vColor;
          
          void main() {
            vec4 texColor = texture2D(map, gl_PointCoord);
            gl_FragColor = vec4(vColor, 1.0) * texColor * opacity;
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [size, starTexture, gl],
  )

  // Smoothly animate opacity and apply explosion displacement
  useFrame(() => {
    // Lerp to target opacity
    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetOpacity.current,
      0.05,
    )

    // Apply explosion effect if wavePhase > 0
    if (wavePhase > 0 && pointsRef.current && explosionDirections.current && explosionSpeeds.current) {
      const posAttr = pointsRef.current.geometry.attributes.position
      
      // Accelerating displacement: phase² for acceleration feel
      const explosionProgress = wavePhase * wavePhase
      const maxDistance = 500 // Stars fly up to 500 units away
      
      // Fade out stars as they fly away (reaches 0 at wavePhase = 1)
      const fadeOut = Math.max(0, 1 - wavePhase)
      shaderMaterial.uniforms.opacity.value = currentOpacity.current * fadeOut

      for (let i = 0; i < responsiveCount; i++) {
        const idx = i * 3
        const origX = originalPositions.current[idx]
        const origY = originalPositions.current[idx + 1]
        const origZ = originalPositions.current[idx + 2]

        // Get this star's random direction and speed
        const dirX = explosionDirections.current[idx]
        const dirY = explosionDirections.current[idx + 1]
        const dirZ = explosionDirections.current[idx + 2]
        const speed = explosionSpeeds.current[i]

        // Calculate displacement with acceleration
        const displacement = explosionProgress * maxDistance * speed

        // Apply displacement in random direction
        posAttr.array[idx] = origX + dirX * displacement
        posAttr.array[idx + 1] = origY + dirY * displacement
        posAttr.array[idx + 2] = origZ + dirZ * displacement
      }

      posAttr.needsUpdate = true
      
      // Update trails
      if (trailsRef.current) {
        trailsRef.current.children.forEach((line, i) => {
          const lineMesh = line as THREE.Line
          const lineGeo = lineMesh.geometry as THREE.BufferGeometry
          const linePos = lineGeo.attributes.position
          
          const idx = i * 3
          const origX = originalPositions.current[idx]
          const origY = originalPositions.current[idx + 1]
          const origZ = originalPositions.current[idx + 2]
          
          const dirX = explosionDirections.current![idx]
          const dirY = explosionDirections.current![idx + 1]
          const dirZ = explosionDirections.current![idx + 2]
          const speed = explosionSpeeds.current![i]
          
          const displacement = explosionProgress * maxDistance * speed
          const trailLength = Math.min(displacement * 0.3, 50) // Trail is 30% of travel distance, max 50 units
          
          // Current position (end of trail)
          const currentX = origX + dirX * displacement
          const currentY = origY + dirY * displacement
          const currentZ = origZ + dirZ * displacement
          
          // Trail start (behind the star)
          const trailStartX = currentX - dirX * trailLength
          const trailStartY = currentY - dirY * trailLength
          const trailStartZ = currentZ - dirZ * trailLength
          
          // Update line geometry
          linePos.array[0] = trailStartX
          linePos.array[1] = trailStartY
          linePos.array[2] = trailStartZ
          linePos.array[3] = currentX
          linePos.array[4] = currentY
          linePos.array[5] = currentZ
          linePos.needsUpdate = true
          
          // Fade trail with explosion (trails fade out completely with stars)
          const material = lineMesh.material as THREE.LineBasicMaterial
          material.opacity = fadeOut * 0.6 // Max 0.6 opacity, reaches 0 when fadeOut = 0
        })
      }
    } else {
      // Normal opacity when not exploding
      shaderMaterial.uniforms.opacity.value = currentOpacity.current
      
      // Hide trails when not exploding
      if (trailsRef.current) {
        trailsRef.current.visible = false
      }
      
      // Reset star positions to original when wavePhase is 0
      if (pointsRef.current) {
        const posAttr = pointsRef.current.geometry.attributes.position
        let needsReset = false
        
        // Check if positions differ from original (explosion happened)
        for (let i = 0; i < responsiveCount * 3; i++) {
          if (Math.abs(posAttr.array[i] - originalPositions.current[i]) > 0.01) {
            needsReset = true
            break
          }
        }
        
        // Reset positions if needed
        if (needsReset) {
          for (let i = 0; i < responsiveCount * 3; i++) {
            posAttr.array[i] = originalPositions.current[i]
          }
          posAttr.needsUpdate = true
        }
      }
    }
  })

  return (
    <>
      <points
        ref={pointsRef}
        geometry={geometry}
        material={shaderMaterial}
        renderOrder={3}
      />
      {/* Star trails for explosion effect */}
      <group ref={trailsRef} visible={wavePhase > 0}>
        {Array.from({ length: responsiveCount }).map((_, i) => {
          const trailGeometry = new THREE.BufferGeometry()
          const trailPositions = new Float32Array(6) // 2 points (start and end)
          trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
          
          const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.6,
            transparent: true,
            blending: THREE.AdditiveBlending,
          })
          
          return (
            <primitive key={i} object={new THREE.Line(trailGeometry, trailMaterial)} />
          )
        })}
      </group>
    </>
  )
}
