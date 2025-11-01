import { useMemo, useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface BackgroundStarsProps {
  radius?: number
  count?: number
  colors?: number[]
  size?: number
  opacity?: number
}

export default function BackgroundStars({
  radius = 300,
  count = 500,
  colors = [0x0a1128, 0x1a2a3a],
  size = 1.0,
  opacity = 0.5,
}: BackgroundStarsProps) {
  const { size: viewport } = useThree()

  // Adjust star count based on viewport size
  const responsiveCount = useMemo(() => {
    const area = viewport.width * viewport.height
    // Mobile (~400x800 = 320k): ~500 stars
    // Tablet (~768x1024 = 786k): ~800 stars
    // Desktop (~1920x1080 = 2M): ~1600 stars
    const calculated = Math.floor(area / 1200)
    return Math.min(Math.max(calculated, 500), count) // Between 500 and count
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
  }, [responsiveCount, radius])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    return geo
  }, [positions, starColors])

  // Fade in animation
  const [fadeOpacity, setFadeOpacity] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => setFadeOpacity(opacity), 100)
    return () => clearTimeout(timer)
  }, [opacity])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={size}
        transparent
        opacity={fadeOpacity}
        sizeAttenuation={false}
        depthWrite={false}
        vertexColors={true}
      />
    </points>
  )
}
