import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { MOCK_PEOPLE } from './mockData'

// Constellation lines component - draws glowing lines connecting stars
export function ConstellationLines({
  positions,
  placements,
}: {
  positions: [number, number, number][]
  placements: Map<string, 'inner' | 'close' | 'outer'>
}) {
  // Create line segments (pairs of points)
  const lineSegments = useMemo(() => {
    const segments: Array<[THREE.Vector3, THREE.Vector3]> = []

    // Only connect charted stars (those with placements)
    const chartedIndices = MOCK_PEOPLE.map((person, index) => ({
      person,
      index,
    }))
      .filter(({ person }) => placements.has(person.id))
      .map(({ index }) => index)

    // Need at least 2 charted stars to draw lines
    if (chartedIndices.length < 2) {
      return segments
    }

    // Create lines between charted stars that are close to each other
    for (let i = 0; i < chartedIndices.length; i++) {
      const starIndex = chartedIndices[i]
      const pos1 = new THREE.Vector3(...positions[starIndex])

      // Find nearest charted neighbors to connect
      const distances = chartedIndices
        .map((otherIndex) => ({
          index: otherIndex,
          distance: pos1.distanceTo(
            new THREE.Vector3(...positions[otherIndex]),
          ),
        }))
        .filter((d) => d.index !== starIndex)
        .sort((a, b) => a.distance - b.distance)

      // Connect to 2 nearest charted neighbors
      const connectCount = Math.min(2, distances.length)
      for (let k = 0; k < connectCount; k++) {
        const neighbor = distances[k]
        // Only draw if distance is reasonable (not too far)
        if (neighbor.distance < 30) {
          segments.push([
            pos1.clone(),
            new THREE.Vector3(...positions[neighbor.index]),
          ])
        }
      }
    }

    return segments
  }, [positions, placements])

  return (
    <group>
      {lineSegments.map((points, idx) => (
        <group key={idx}>
          {/* Outer glow layer - thick and transparent */}
          <Line
            points={points}
            color="#22d3ee"
            lineWidth={12}
            transparent
            opacity={0.2}
            depthWrite={false}
            depthTest={false}
            renderOrder={-2}
          />
          {/* Inner sharp line - thin and bright */}
          <Line
            points={points}
            color="#22d3ee"
            lineWidth={1.5}
            transparent
            opacity={0.9}
            depthWrite={false}
            depthTest={false}
            renderOrder={-1}
          />
        </group>
      ))}
    </group>
  )
}
