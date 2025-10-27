// Chart Your Stars - Type definitions

import * as THREE from 'three'
import { MOCK_PEOPLE } from './mockData'

// StarData: All state for a single person/star
export interface StarData {
  person: (typeof MOCK_PEOPLE)[0]
  index: number // Index in MOCK_PEOPLE array for ordering
  initialPosition: [number, number, number] // Random position at journey start
  constellationPosition: [number, number, number] | null // Position after placement
  placement: 'inner' | 'close' | 'outer' | null // Which ring (Close/Near/Distant)
  visited: boolean // Has user visited this star yet
}

// Journey phases
export type JourneyPhase =
  | 'intro'
  | 'flying'
  | 'approaching'
  | 'arrived'
  | 'placed'
  | 'takeoff'
  | 'complete'
  | 'returning'

// Star overlay for 2D UI
export interface StarOverlay {
  person: (typeof MOCK_PEOPLE)[0]
  screenX: number
  screenY: number
  distance: number
  isNear: boolean
}

// Star component props
export interface StarProps {
  person: (typeof MOCK_PEOPLE)[0]
  position: [number, number, number]
  isTarget: boolean
  placement?: 'inner' | 'close' | 'outer'
  texture: THREE.Texture
  journeyPhase?: JourneyPhase
}
