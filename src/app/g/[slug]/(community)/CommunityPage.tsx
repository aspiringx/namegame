import { getGroup } from './data'
import CommunityGroupPageClient from './CommunityGroupPageClient'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'

export default async function CommunityPage({
  params: paramsProp,
}: {
  params: Promise<{ slug: string }>
}) {
  const params = await paramsProp
  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)
  const groupData = await getGroup(params.slug, deviceType)

  if (!groupData) {
    notFound()
  }

  return <CommunityGroupPageClient groupData={groupData} view="grid" />
}
