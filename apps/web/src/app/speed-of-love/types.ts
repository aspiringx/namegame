// Chart Your Stars - Type definitions

import * as THREE from 'three'
import { Dispatch, SetStateAction } from 'react'

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
  | 'flying'
  | 'approaching'
  | 'arrived'
  | 'placed'
  | 'takeoff'
  | 'complete'
  | 'returning'

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
  id: string
  data: StarData
  position: [number, number, number]
  isTarget: boolean
  placement?: 'inner' | 'close' | 'outer'
  texture: THREE.Texture
  journeyPhase: JourneyPhase
}

// Scene data structure
export interface Scene {
  scene: number
  description: string
  narration: string
  sceneType: string
  cameraPosition?: [number, number, number]
  cameraFOV?: number
  
  // Visibility flags - controls which elements render in this scene
  visibility?: {
    heroStar?: boolean
    primaryStars?: boolean
    oldConstellation?: boolean
    newPrimaryStars?: boolean
    newConstellation?: boolean
  }

  // Scene 1: cosmicView
  primaryStars?: {
    count: number
    radius?: number
    baseSize?: number
  }
  newPrimaryStars?: {
    count: number
    radius?: number
    baseSize?: number
    xOffset?: number
    zOffset?: number
  }
  backgroundStars?: {
    count: number
    baseSize: number
    colors: number[]
    radius?: number
    opacity?: number
  }

  // Scene 2: focusStar
  heroStar?: {
    position: [number, number, number]
    brightness: number
  }
  nearbyStars?: {
    count: number
    minDistance: number
    maxDistance: number
  }

  // Scene 3: constellationForm
  twinkleEffect?: {
    duration: number
    starCount: number
    intensity: number
  }
  connectionLines?: {
    color: string
    opacity: number
    width: number
    drawSpeed?: number
  }
  connectionsCount?: number

  // Scene 4: orbitChange (timing controlled by Theatre.js)

  // Scene 5: starDrift
  driftingStars?: {
    count: number
    speed: number
    fadeConnections: boolean
  }

  // Scene 5: ripples
  waveEffect?: {
    amplitude: number
    frequency: number
    speed: number
    waveCount: number
  }

  // Scene 6: dimStar
  heroStarBrightness?: number
  otherStarsBrightness?: number
  ambientDim?: number

  // Scene 7: lovePulse
  pulseEffect?: {
    intensity: number
    speed: number
    color: string
  }

  // Scene 8: constellationReform
  starBrightness?: number
  connectionBrightness?: number
  colorTint?: string
  tintOpacity?: number

  // Scene 9: logoReveal
  logoUrl?: string
  logoOpacity?: number
  logoFadeIn?: number
}

// Note: AnimationCommand is deprecated - Theatre.js handles all animations
// Keeping type for backward compatibility during migration
export type AnimationCommand = {
  type: string
  params: Record<string, any>
}

export interface SceneProps {
  stars: Map<string, StarData>
  onUpdateStars: Dispatch<SetStateAction<Map<string, StarData>>>
  onUpdateOverlays: Dispatch<SetStateAction<StarOverlay[]>>
  currentScene: Scene
}
