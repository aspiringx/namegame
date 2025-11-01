import { useMemo } from 'react'
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

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    return pos
  }, [count, radius])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={size}
        color={colors[0]}
        transparent
        opacity={opacity}
        sizeAttenuation={true}
      />
    </points>
  )
}
