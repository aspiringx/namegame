import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'
import { getGroupForLayout } from '../../utils'
import { UniversalClient } from '@/components/UniversalClient'

interface UniversalGamesPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Universal Games Page - Works for all group types
 * Uses UniversalClient with games view
 */
export default async function UniversalGamesPage({
  params: paramsProp,
}: UniversalGamesPageProps) {
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
