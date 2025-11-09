import { Scene } from '../types'

export async function loadScript(): Promise<Scene[]> {
  const response = await fetch('/docs/scripts/animations.json')
  const data = await response.json()
  // Extract scenes array from animations.json structure
  return data.scenes
}
