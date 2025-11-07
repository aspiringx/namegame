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
  wavePhase?: number // 0-1 cosmic wave ripple effect
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

  // Store original positions for wave displacement
  const originalPositions = useRef(positions.slice())
  const pointsRef = useRef<THREE.Points>(null)

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

  // Smoothly animate opacity and apply cosmic wave displacement
  useFrame(() => {
    // Lerp to target opacity
    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetOpacity.current,
      0.05,
    )

    shaderMaterial.uniforms.opacity.value = currentOpacity.current

    // Apply cosmic wave displacement if wavePhase > 0
    if (wavePhase > 0 && pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position

      for (let i = 0; i < responsiveCount; i++) {
        const idx = i * 3
        const origX = originalPositions.current[idx]
        const origY = originalPositions.current[idx + 1]
        const origZ = originalPositions.current[idx + 2]

        // Calculate distance from wave origin (xOffset, yOffset, zOffset)
        const dx = origX - xOffset
        const dy = origY - yOffset
        const dz = origZ - zOffset
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        // Wave travels outward: stars at distance D are displaced when wave reaches them
        // Wave speed: travels ~150 units over phase 0-1
        const waveRadius = wavePhase * 150
        const distFromWave = Math.abs(dist - waveRadius)

        // Displacement magnitude: peaks when wave is at star's distance
        // Falls off quickly (within 30 units of wave front)
        const displacement =
          Math.max(0, 1 - distFromWave / 30) *
          200 *
          Math.sin(wavePhase * Math.PI)

        // Displace radially outward from origin
        const direction = new THREE.Vector3(dx, dy, dz).normalize()

        posAttr.array[idx] = origX + direction.x * displacement
        posAttr.array[idx + 1] = origY + direction.y * displacement
        posAttr.array[idx + 2] = origZ + direction.z * displacement
      }

      posAttr.needsUpdate = true
    }
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={shaderMaterial}
      renderOrder={3}
    />
  )
}
