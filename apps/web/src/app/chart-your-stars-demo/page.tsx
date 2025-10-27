import { Metadata } from 'next'
import ChartYourStars from './ChartYourStars'

export const metadata: Metadata = {
  title: 'Chart Your Stars Demo | RelationStar',
  description: 'Explore your universe and chart your relationships',
}

export default function ChartYourStarsDemoPage() {
  return <ChartYourStars />
}
