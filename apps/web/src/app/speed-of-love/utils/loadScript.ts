import { Scene } from '../types'

export async function loadScript(): Promise<Scene[]> {
  const response = await fetch('/docs/scripts/speed-of-love-intro.json')
  return await response.json()
}
