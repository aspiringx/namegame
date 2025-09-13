import { getGroup } from './data'
import CommunityGroupPageClient from './CommunityGroupPageClient'
import { notFound } from 'next/navigation'

export default async function CommunityPage({ params: paramsProp }: { params: Promise<{ slug: string }> }) {
  const params = await paramsProp;
  const groupData = await getGroup(params.slug)

  if (!groupData) {
    notFound()
  }

  return <CommunityGroupPageClient groupData={groupData} view="grid" />
}
