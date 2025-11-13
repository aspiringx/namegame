import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ShootingStar() {
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
