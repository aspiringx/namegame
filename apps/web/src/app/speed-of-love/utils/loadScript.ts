import { Scene } from '../types'

export async function loadScript(): Promise<Scene[]> {
  const response = await fetch('/docs/scripts/scenes.json')
  return await response.json()
}
