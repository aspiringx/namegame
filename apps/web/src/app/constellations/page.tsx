import { Metadata } from 'next'
import MakeConstellation from './MakeConstellation'

export const metadata: Metadata = {
  title: 'RelationStar - Constellations',
  description: 'Constellations',
}

// Disable static generation for this page (client-side only with Three.js)
export const dynamic = 'force-dynamic'

export default function MakeConstellationDemoPage() {
  return (
    <div className="overflow-hidden">
      <MakeConstellation />
    </div>
  )
}
