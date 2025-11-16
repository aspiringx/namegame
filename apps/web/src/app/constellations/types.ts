// Chart Your Stars - Type definitions

import * as THREE from 'three'

// Person data structure
export interface Person {
  id: string
  name: string
  photo: string
}

// StarData: All state for a single person/star
export interface StarData {
  person: Person
  index: number // Index in MOCK_PEOPLE array for ordering
  initialPosition: [number, number, number] | null // Random position at journey start
  constellationPosition: [number, number, number] | null // Position after placement
  placement: 'inner' | 'close' | 'outer' | null // Which ring (Close/Near/Distant)
  visited: boolean // Has user visited this star yet
}

// Journey phases
export type JourneyPhase =
  | 'intro'
  | 'selecting'
  | 'flying'
  | 'approaching'
  | 'arrived'
  | 'placed'
  | 'takeoff'
  | 'complete'
  | 'returning'
  | 'returning-batch-complete'
  | 'returning-journey-complete'
  | 'constellation-review'

// Star component props - for rendering individual stars in 3D space
export interface StarProps {
  person: Person // Person data (currently unused in Star component, but kept for future features)
  position: [number, number, number] // 3D world position
  isTarget: boolean // Whether this is the star being flown to
  placement?: 'inner' | 'close' | 'outer' // Which ring the star was placed in (undefined = not placed yet)
  texture: THREE.Texture // Photo texture for the star
  journeyPhase?: JourneyPhase // Current phase of the journey (affects rendering)
}
