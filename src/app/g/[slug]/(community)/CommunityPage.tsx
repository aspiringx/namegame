import { getGroup } from './data'
import CommunityClient from './CommunityClient'
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

  return <CommunityClient groupData={groupData} view="grid" />
}
