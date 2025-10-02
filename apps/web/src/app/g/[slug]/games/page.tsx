import { headers } from 'next/headers'
import { getGroupForLayout } from '../utils'
import { UniversalClient } from '@/components/UniversalClient'
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

  return (
    <UniversalClient
      view="games"
      initialMembers={groupData.members}
      groupSlug={params.slug}
      initialMemberCount={groupData.members.length}
    />
  )
}
