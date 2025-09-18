import { headers } from 'next/headers'
import { getGroupForLayout } from '../utils'
import GamesPageClient from './GamesPageClient'
import { notFound } from 'next/navigation'
import { getDeviceTypeFromHeaders } from '@/lib/device'

export default async function GamesPage({
  params: paramsProp,
}: {
  params: Promise<{ slug: string }>
}) {
  const params = await paramsProp
  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)
  const groupData = await getGroupForLayout(params.slug, deviceType)

  if (!groupData) {
    notFound()
  }

  return <GamesPageClient group={groupData} />
}
