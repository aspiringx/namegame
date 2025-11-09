import { useMemo } from 'react'
import * as THREE from 'three'
import { MOCK_PEOPLE } from './mockData'

// Constellation lines component - draws lines connecting stars
export function ConstellationLines({
  positions,
  placements,
}: {
  positions: [number, number, number][]
  placements: Map<string, 'inner' | 'close' | 'outer'>
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []

    // Only connect charted stars (those with placements)
    const chartedIndices = MOCK_PEOPLE.map((person, index) => ({
      person,
      index,
    }))
      .filter(({ person }) => placements.has(person.id))
      .map(({ index }) => index)

    // Need at least 2 charted stars to draw lines
    if (chartedIndices.length < 2) {
      return pts
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
          pts.push(pos1)
          pts.push(new THREE.Vector3(...positions[neighbor.index]))
        }
      }
    }

    return pts
  }, [positions, placements])

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const positions = new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [points])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#4ade80" opacity={0.6} transparent />
    </lineSegments>
  )
}
