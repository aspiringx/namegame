import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

interface HeroConstellationLinesProps {
  heroPosition: [number, number, number]
  starPositions: Float32Array
  color?: string
  opacity?: number
  fadeInDuration?: number
}

export default function HeroConstellationLines({
  heroPosition,
  starPositions,
  color = '#22d3ee',
  opacity = 0.6,
  fadeInDuration = 2500,
}: HeroConstellationLinesProps) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(Date.now())
  const currentOpacity = useRef(0)

  // Connect ALL primary stars - create line segments
  const lineSegments = useMemo(() => {
    const heroPos = new THREE.Vector3(...heroPosition)
    const starCount = starPositions.length / 3

    // Get all stars with their angles around hero star
    const starsWithAngles: { index: number; angle: number }[] = []
    for (let i = 0; i < starCount; i++) {
      const starPos = new THREE.Vector3(
        starPositions[i * 3],
        starPositions[i * 3 + 1],
        starPositions[i * 3 + 2],
      )
      const dx = starPos.x - heroPos.x
      const dy = starPos.y - heroPos.y
      const angle = Math.atan2(dy, dx)

      starsWithAngles.push({ index: i, angle })
    }

    // Sort by angle to create a ring around hero star
    starsWithAngles.sort((a, b) => a.angle - b.angle)

    // Create array of line segments (each segment is a pair of points)
    const segments: Array<[THREE.Vector3, THREE.Vector3]> = []

    // Ring connections
    starsWithAngles.forEach((star, idx) => {
      const nextIdx = (idx + 1) % starsWithAngles.length
      const nextStar = starsWithAngles[nextIdx]

      segments.push([
        new THREE.Vector3(
          starPositions[star.index * 3],
          starPositions[star.index * 3 + 1],
          starPositions[star.index * 3 + 2],
        ),
        new THREE.Vector3(
          starPositions[nextStar.index * 3],
          starPositions[nextStar.index * 3 + 1],
          starPositions[nextStar.index * 3 + 2],
        ),
      ])
    })

    // Hero star connections
    const heroConnections = Math.min(4, starsWithAngles.length)
    for (let i = 0; i < heroConnections; i++) {
      const starIdx = Math.floor((i * starsWithAngles.length) / heroConnections)
      const star = starsWithAngles[starIdx]
      segments.push([
        new THREE.Vector3(...heroPosition),
        new THREE.Vector3(
          starPositions[star.index * 3],
          starPositions[star.index * 3 + 1],
          starPositions[star.index * 3 + 2],
        ),
      ])
    }

    return segments
  }, [heroPosition, starPositions])

  // Fade in animation
  useFrame(() => {
    if (!groupRef.current) return

    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / fadeInDuration, 1)

    // Ease-in-out for smooth fade
    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

    const targetOpacity = opacity * eased
    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetOpacity,
      0.1,
    )

    // Update opacity on all line materials
    // Each line segment has 2 meshes: glow (first) and main line (second)
    let meshIndex = 0
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshBasicMaterial
        // First mesh in each pair is glow (lower opacity), second is main line
        const isGlow = meshIndex % 2 === 0
        material.opacity = isGlow 
          ? currentOpacity.current * 0.20 
          : currentOpacity.current
        material.needsUpdate = true
        meshIndex++
      }
    })
  })

  return (
    <group ref={groupRef}>
      {lineSegments.map((points, idx) => (
        <group key={idx}>
          {/* Outer glow layer - very thick and very transparent */}
          <Line
            points={points}
            color={color}
            lineWidth={12}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
            renderOrder={997}
          />
          {/* Inner sharp line - thin and bright */}
          <Line
            points={points}
            color={color}
            lineWidth={1.5}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
            renderOrder={998}
          />
        </group>
      ))}
    </group>
  )
}
