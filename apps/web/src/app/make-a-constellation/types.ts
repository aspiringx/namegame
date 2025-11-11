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
  | 'constellation-review'

// Star overlay for 2D UI
export interface StarOverlay {
  person: Person
  screenX: number
  screenY: number
  distance: number
  isNear: boolean
}

// Star component props
export interface StarProps {
  person: Person
  position: [number, number, number]
  isTarget: boolean
  placement?: 'inner' | 'close' | 'outer'
  texture: THREE.Texture
  journeyPhase?: JourneyPhase
}
