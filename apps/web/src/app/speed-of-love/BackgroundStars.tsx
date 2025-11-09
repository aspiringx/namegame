import { useMemo, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BackgroundStarsProps {
  radius?: number
  count?: number
  size?: number
  opacity?: number
  enableTwinkling?: boolean
}

export default function BackgroundStars({
  radius = 500,
  count = 2000,
  size = 1.5,
  opacity = 0.8,
  enableTwinkling = false,
}: BackgroundStarsProps) {
  const { size: viewport } = useThree()

  // Adjust star count based on viewport size
  const responsiveCount = useMemo(() => {
    const area = viewport.width * viewport.height
    // Mobile (~400x800 = 320k): ~600 stars
    // Tablet (~768x1024 = 786k): ~800 stars
    // Desktop (~1920x1080 = 2M): ~1600 stars
    const calculated = Math.floor(area / 1200)
    return Math.min(Math.max(calculated, 600), count) // Between 600 and count
  }, [viewport.width, viewport.height, count])

  const { positions, starColors } = useMemo(() => {
    const pos = new Float32Array(responsiveCount * 3)
    const cols = new Float32Array(responsiveCount * 3)

    for (let i = 0; i < responsiveCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)

      // More dramatic brightness variation: 20% to 100%
      // Use power distribution to make more dim stars (more realistic)
      const random = Math.random()
      const brightness = 0.2 + Math.pow(random, 1.5) * 0.8

      // Add slight color temperature variation
      // Some stars slightly warmer (yellowish), some cooler (blueish)
      const temp = Math.random()
      if (temp > 0.7) {
        // Warmer stars (20% chance)
        cols[i * 3] = brightness * 1.0 // R
        cols[i * 3 + 1] = brightness * 0.95 // G
        cols[i * 3 + 2] = brightness * 0.85 // B
      } else if (temp < 0.3) {
        // Cooler stars (30% chance)
        cols[i * 3] = brightness * 0.85 // R
        cols[i * 3 + 1] = brightness * 0.95 // G
        cols[i * 3 + 2] = brightness * 1.0 // B
      } else {
        // Neutral white (50% chance)
        cols[i * 3] = brightness // R
        cols[i * 3 + 1] = brightness // G
        cols[i * 3 + 2] = brightness // B
      }
    }
    return { positions: pos, starColors: cols }
  }, []) // Empty deps - generate once and never change

  // Generate random phase offsets and indices for twinkling stars
  const twinkleData = useMemo(() => {
    const twinkleCount = Math.floor(responsiveCount * 0.4) // 40% of stars twinkle
    const indices: number[] = []
    const phases: number[] = []
    const baseBrightness: number[] = []

    // Pick random stars to twinkle
    const usedIndices = new Set<number>()
    while (indices.length < twinkleCount) {
      const idx = Math.floor(Math.random() * responsiveCount)
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx)
        indices.push(idx)
        phases.push(Math.random() * Math.PI * 2)
        // Store original brightness
        baseBrightness.push(starColors[idx * 3])
      }
    }

    return { indices, phases, baseBrightness }
  }, [])

  // Create circular texture for stars - keep center bright
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,1)') // Keep bright longer
    gradient.addColorStop(0.9, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 32)

    return new THREE.CanvasTexture(canvas)
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    return geo
  }, [positions, starColors])

  // Smooth opacity animation
  const currentOpacity = useRef(0)
  const targetOpacity = useRef(opacity)
  const materialRef = useRef<THREE.PointsMaterial>(null)

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

  // Smoothly animate opacity changes and twinkling
  useFrame(({ clock }) => {
    if (!materialRef.current) return

    // Lerp to target opacity
    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetOpacity.current,
      0.05,
    )

    materialRef.current.opacity = currentOpacity.current

    // Apply twinkling effect if enabled (throttled to every 2 frames)
    if (enableTwinkling && geometry.attributes.color) {
      const time = clock.getElapsedTime()
      const frameCount = Math.floor(time * 60) // Approximate frame count

      // Only update every 2 frames to reduce GPU load
      if (frameCount % 2 === 0) {
        const colorAttr = geometry.attributes.color

        twinkleData.indices.forEach((starIdx, i) => {
          const phase = twinkleData.phases[i]
          // Very dramatic twinkle: range from 0.1 to 3.5 (very bright at peak)
          const twinkle = Math.sin(time * 2.5 + phase) * 1.7 + 1.8

          // Temporarily modify this star's brightness
          const baseIdx = starIdx * 3
          const baseBrightness = twinkleData.baseBrightness[i]
          colorAttr.array[baseIdx] = baseBrightness * twinkle
          colorAttr.array[baseIdx + 1] = baseBrightness * twinkle
          colorAttr.array[baseIdx + 2] = baseBrightness * twinkle
        })

        colorAttr.needsUpdate = true
      }
    }
  })

  return (
    <points geometry={geometry} renderOrder={0}>
      <pointsMaterial
        ref={materialRef}
        size={size}
        map={starTexture}
        transparent
        opacity={0}
        sizeAttenuation={false}
        depthWrite={false}
        vertexColors={true}
      />
    </points>
  )
}
