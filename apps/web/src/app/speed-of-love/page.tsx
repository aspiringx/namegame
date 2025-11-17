import { Metadata } from 'next'
import SpeedOfLove from './SpeedOfLove'

export const metadata: Metadata = {
  title: 'RelationStar - The speed of love',
  description: 'Your universe at the speed of love',
}

// Disable static generation for this page (client-side only with Three.js)
export const dynamic = 'force-dynamic'

export default function SpeedOfLovePage() {
  return <SpeedOfLove />
}
