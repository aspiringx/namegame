import { Metadata } from 'next'
import StarsClient from './StarsClient'

export const metadata: Metadata = {
  title: 'Relation Star - Chart a Star',
  description:
    'Chart the five points of a star to better understand a relationship',
}

export default function StarsPage() {
  return <StarsClient />
}
