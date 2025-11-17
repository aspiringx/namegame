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
  // Create line segments using minimum spanning tree to ensure all stars are connected
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

    // Build minimum spanning tree using Prim's algorithm
    // This ensures all stars are connected in a single network
    const inTree = new Set<number>()
    const edges: Array<{ from: number; to: number; distance: number }> = []

    // Start with first charted star
    inTree.add(chartedIndices[0])

    // Keep adding nearest star to the tree until all are connected
    while (inTree.size < chartedIndices.length) {
      let minDistance = Infinity
      let bestEdge: { from: number; to: number; distance: number } | null = null

      // Find the shortest edge from tree to a non-tree star
      for (const inIndex of inTree) {
        const pos1 = new THREE.Vector3(...positions[inIndex])
        
        for (const outIndex of chartedIndices) {
          if (inTree.has(outIndex)) continue
          
          const pos2 = new THREE.Vector3(...positions[outIndex])
          const distance = pos1.distanceTo(pos2)
          
          if (distance < minDistance) {
            minDistance = distance
            bestEdge = { from: inIndex, to: outIndex, distance }
          }
        }
      }

      // Add the best edge to the tree
      if (bestEdge) {
        edges.push(bestEdge)
        inTree.add(bestEdge.to)
      } else {
        break // Safety: shouldn't happen but prevents infinite loop
      }
    }

    // Convert edges to line segments
    for (const edge of edges) {
      segments.push([
        new THREE.Vector3(...positions[edge.from]),
        new THREE.Vector3(...positions[edge.to]),
      ])
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
