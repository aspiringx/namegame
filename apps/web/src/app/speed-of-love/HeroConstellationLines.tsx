import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface HeroConstellationLinesProps {
  heroPosition: [number, number, number]
  starPositions: Float32Array
  connectionsCount?: number
  color?: string
  opacity?: number
  fadeInDuration?: number
}

export default function HeroConstellationLines({
  heroPosition,
  starPositions,
  connectionsCount = 5,
  color = '#22d3ee',
  opacity = 0.6,
  fadeInDuration = 2500,
}: HeroConstellationLinesProps) {
  const lineRef = useRef<THREE.LineSegments>(null)
  const startTime = useRef(Date.now())
  const currentOpacity = useRef(0)

  // Connect ALL primary stars with straight lines
  const geometry = useMemo(() => {
    const heroPos = new THREE.Vector3(...heroPosition)
    const starCount = starPositions.length / 3
    
    // Get all stars with their angles around hero star
    const starsWithAngles: { index: number; angle: number }[] = []
    for (let i = 0; i < starCount; i++) {
      const starPos = new THREE.Vector3(
        starPositions[i * 3],
        starPositions[i * 3 + 1],
        starPositions[i * 3 + 2]
      )
      const dx = starPos.x - heroPos.x
      const dy = starPos.y - heroPos.y
      const angle = Math.atan2(dy, dx)
      
      starsWithAngles.push({ index: i, angle })
    }
    
    // Sort by angle to create a ring around hero star
    starsWithAngles.sort((a, b) => a.angle - b.angle)
    
    // Create straight line segments connecting all stars in ring
    const points: number[] = []
    
    starsWithAngles.forEach((star, idx) => {
      const nextIdx = (idx + 1) % starsWithAngles.length
      const nextStar = starsWithAngles[nextIdx]
      
      // Line from this star to next star
      points.push(
        starPositions[star.index * 3],
        starPositions[star.index * 3 + 1],
        starPositions[star.index * 3 + 2]
      )
      points.push(
        starPositions[nextStar.index * 3],
        starPositions[nextStar.index * 3 + 1],
        starPositions[nextStar.index * 3 + 2]
      )
    })
    
    // Connect hero star to 3-4 evenly spaced stars for grounding
    const heroConnections = Math.min(4, starsWithAngles.length)
    for (let i = 0; i < heroConnections; i++) {
      // Evenly space connections around the ring
      const starIdx = Math.floor(i * starsWithAngles.length / heroConnections)
      const star = starsWithAngles[starIdx]
      points.push(...heroPosition)
      points.push(
        starPositions[star.index * 3],
        starPositions[star.index * 3 + 1],
        starPositions[star.index * 3 + 2]
      )
    }
    
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
    return geom
  }, [heroPosition, starPositions])

  // Fade in animation
  useFrame(() => {
    if (!lineRef.current) return

    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / fadeInDuration, 1)
    
    // Ease-in-out for smooth fade
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
    
    const targetOpacity = opacity * eased
    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetOpacity,
      0.1
    )
    
    // Update line opacity
    const material = lineRef.current.material as THREE.LineBasicMaterial
    material.opacity = currentOpacity.current
  })

  return (
    <lineSegments ref={lineRef} geometry={geometry} renderOrder={2}>
      <lineBasicMaterial
        color={color}
        opacity={0}
        transparent
        depthWrite={false}
      />
    </lineSegments>
  )
}
