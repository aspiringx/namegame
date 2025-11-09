import {
  getProject,
  types,
  IProject,
  ISheet,
  ISheetObject,
} from '@theatre/core'
import animationConfig from '../../../public/docs/scripts/animations.json'
import theatreState from '../../../public/docs/scripts/theatre-state.json'

// Type definitions for our animation config
interface AnimationProperty {
  type: 'number' | 'boolean' | 'string'
  range?: [number, number]
  default: number | boolean | string
  static?: boolean
  description?: string
}

interface SceneAnimation {
  duration?: number // Optional - calculated dynamically from keyframes if not provided
  properties: Record<string, AnimationProperty>
}

export interface SceneConfig {
  scene: number
  description: string
  narration: string
  sceneType: string
  cameraPosition: [number, number, number]
  cameraFOV: number
  animation: SceneAnimation
  [key: string]: any // Allow additional scene-specific properties
}

interface AnimationConfig {
  projectName: string
  scenes: SceneConfig[]
}

const config = animationConfig as unknown as AnimationConfig

// Create Theatre.js project with state
export const theatreProject: IProject = getProject(config.projectName, {
  state: theatreState,
})

// Store sheets and animation objects
export const sheets: Map<number, ISheet> = new Map()
export const animations: Map<number, ISheetObject<any>> = new Map()

// Initialize Theatre.js sheets and objects from config
export function initializeTheatreFromConfig() {
  config.scenes.forEach((sceneConfig) => {
    const sheetName = `Scene ${sceneConfig.scene}`
    const sheet = theatreProject.sheet(sheetName)
    sheets.set(sceneConfig.scene, sheet)

    // Build Theatre.js property types from config
    const props: Record<string, any> = {}
    Object.entries(sceneConfig.animation.properties).forEach(
      ([propName, propConfig]) => {
        if (propConfig.type === 'number' && propConfig.range) {
          props[propName] = types.number(propConfig.default as number, {
            range: propConfig.range,
          })
        }
        // Add other types as needed (boolean, string, etc.)
      },
    )

    // Create animation object
    const animationObject = sheet.object(
      `Scene ${sceneConfig.scene} Animation`,
      props,
    )
    animations.set(sceneConfig.scene, animationObject)
  })
}

// Get scene config by scene number
export function getSceneConfig(sceneNumber: number): SceneConfig | undefined {
  return config.scenes.find((s) => s.scene === sceneNumber)
}

// Get animation duration for a scene by finding the last keyframe position
export function getSceneDuration(sceneNumber: number): number {
  // Read keyframes directly from the theatre state file
  const state = theatreState as any
  const sheetName = `Scene ${sceneNumber}`
  const sheetData = state.sheetsById?.[sheetName]
  
  if (!sheetData) return 0

  let maxPosition = 0

  // Access the sequence tracksByObject from the state file
  const tracksByObject = sheetData.sequence?.tracksByObject || {}
  
  // Iterate through all objects in the sequence
  Object.values(tracksByObject).forEach((objectTracks: any) => {
    const trackData = objectTracks?.trackData || {}
    
    // Iterate through all tracks (properties) for this object
    Object.values(trackData).forEach((track: any) => {
      const keyframes = track?.keyframes || []
      
      // Find the maximum position across all keyframes
      keyframes.forEach((keyframe: any) => {
        if (keyframe.position > maxPosition) {
          maxPosition = keyframe.position
        }
      })
    })
  })

  return maxPosition
}

// Get animation object for a scene
export function getSceneAnimation(
  sceneNumber: number,
): ISheetObject<any> | undefined {
  return animations.get(sceneNumber)
}

// Get sheet for a scene
export function getSceneSheet(sceneNumber: number): ISheet | undefined {
  return sheets.get(sceneNumber)
}

// Get all scene configs
export function getAllSceneConfigs(): SceneConfig[] {
  return config.scenes
}
