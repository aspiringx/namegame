import { Metadata } from 'next'
import MakeConstellation from './MakeConstellation'

export const metadata: Metadata = {
  title: 'RelationStar',
  description: 'Make a constellation',
}

// Disable static generation for this page (client-side only with Three.js)
export const dynamic = 'force-dynamic'

export default function MakeConstellationDemoPage() {
  return <MakeConstellation />
}
