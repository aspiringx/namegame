// Star data management utilities

import { StarData } from './types'
import { MOCK_PEOPLE } from './mockData'

// Get star radius range based on placement
export const getStarRadius = (placement?: 'inner' | 'close' | 'outer') => {
  if (!placement) return { min: 25, max: 35 } // Unplaced - very far
  if (placement === 'inner') return { min: 5, max: 10 } // Close - inner circle
  if (placement === 'close') return { min: 10, max: 18 } // Near - middle circle
  return { min: 18, max: 25 } // Far - outer circle
}

// Generate random position within a radius range
export const generateRandomPosition = (
  minRadius: number,
  maxRadius: number,
): [number, number, number] => {
  const theta = Math.random() * Math.PI * 2 // Full rotation around Y axis
  const maxPhi = Math.PI / 4 // 45 degree cone for tight clustering
  const phi = Math.random() * maxPhi
  const radius = minRadius + Math.random() * (maxRadius - minRadius)

  return [
    radius * Math.sin(phi) * Math.cos(theta),
    -10 + radius * Math.sin(phi) * Math.sin(theta), // Offset Y for nav panel
    radius * Math.cos(phi),
  ]
}

// Initialize all star data with random positions
export const initializeStars = (): Map<string, StarData> => {
  const stars = new Map<string, StarData>()
  const { min, max } = getStarRadius(undefined) // Unplaced stars start far away

  MOCK_PEOPLE.forEach((person, index) => {
    stars.set(person.id, {
      person,
      index,
      initialPosition: generateRandomPosition(min, max),
      constellationPosition: null,
      placement: null,
      visited: false,
    })
  })

  return stars
}

// Get current position for a star based on view mode
export const getStarPosition = (
  starData: StarData,
  useConstellationView: boolean,
): [number, number, number] => {
  if (useConstellationView && starData.constellationPosition) {
    return starData.constellationPosition
  }
  // Fallback to origin if initialPosition is null (shouldn't happen after initialization)
  return starData.initialPosition || [0, 0, 0]
}

// Count placed stars
export const getPlacedCount = (stars: Map<string, StarData>): number => {
  return Array.from(stars.values()).filter((s) => s.placement !== null).length
}

// Count visited stars
export const getVisitedCount = (stars: Map<string, StarData>): number => {
  return Array.from(stars.values()).filter((s) => s.visited).length
}

// Find next unvisited star index
export const findNextUnvisitedIndex = (
  stars: Map<string, StarData>,
): number => {
  return MOCK_PEOPLE.findIndex((p) => {
    const starData = stars.get(p.id)!
    return !starData.visited
  })
}
