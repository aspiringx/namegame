import { getGroupForLayout } from '../utils'
import GamesPageClient from './GamesPageClient'
import { notFound } from 'next/navigation'


export default async function GamesPage({ params }: { params: { slug: string } }) {
  const groupData = await getGroupForLayout(params.slug)

  if (!groupData) {
    notFound()
  }

  return <GamesPageClient group={groupData} />
}


