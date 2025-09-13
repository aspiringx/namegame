import { getGroupForLayout } from '../utils'
import GamesPageClient from './GamesPageClient'
import { notFound } from 'next/navigation'


export default async function GamesPage({ params: paramsProp }: { params: Promise<{ slug: string }> }) {
  const params = await paramsProp
  const groupData = await getGroupForLayout(params.slug)

  if (!groupData) {
    notFound()
  }

  return <GamesPageClient group={groupData} />
}


