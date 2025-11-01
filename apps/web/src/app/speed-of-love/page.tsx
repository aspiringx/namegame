import { Metadata } from 'next'
import ChartYourStars from './ChartYourStars'

export const metadata: Metadata = {
  title: 'Chart Your Stars Demo | RelationStar',
  description: 'Explore your universe and chart your relationships',
}

// Disable static generation for this page (client-side only with Three.js)
export const dynamic = 'force-dynamic'

export default function ChartYourStarsDemoPage() {
  return <ChartYourStars />
}
