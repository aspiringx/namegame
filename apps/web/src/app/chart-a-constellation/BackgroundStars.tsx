import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function BackgroundStars() {
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
