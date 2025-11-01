import { useMemo } from 'react'
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
  opacity = 0.5
}: BackgroundStarsProps) {
  const { size: screenSize } = useThree()

  // Responsive star count based on screen size
  const responsiveCount = useMemo(() => {
    const area = screenSize.width * screenSize.height
    // Mobile (~400x800): ~200 stars, Desktop (~1920x1080): ~600 stars
    return Math.floor(Math.min(600, Math.max(200, area / 2000)))
  }, [screenSize.width, screenSize.height])

  const actualCount = count !== undefined ? count : responsiveCount

  const { positions, sizes, opacities } = useMemo(() => {
    const pos = new Float32Array(actualCount * 3)
    const starSizes = new Float32Array(actualCount)
    const starOpacities = new Float32Array(actualCount)

    for (let i = 0; i < actualCount; i++) {
      // Use spherical distribution to fill entire view uniformly
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const actualRadius = radius !== undefined ? radius : 100 + Math.random() * 100 // Far behind constellation

      pos[i * 3] = actualRadius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = actualRadius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = actualRadius * Math.cos(phi)

      // Much more visible sizes: 0.2 to 0.5
      starSizes[i] = 0.2 + Math.random() * 0.3

      // Much brighter: 0.7 to 1.0
      starOpacities[i] = 0.7 + Math.random() * 0.3
    }
    return { positions: pos, sizes: starSizes, opacities: starOpacities }
  }, [actualCount, radius])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))
    return geo
  }, [positions, sizes, opacities])

  // Responsive star size: larger on mobile, smaller on desktop
  const actualStarSize = size !== undefined ? size : (screenSize.width < 768 ? 1.5 : 0.5)

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={actualStarSize}
        color={colors !== undefined ? colors[0] : "#ffffff"}
        transparent
        opacity={opacity}
        sizeAttenuation={false}
        vertexColors={false}
      />
    </points>
  )
}
