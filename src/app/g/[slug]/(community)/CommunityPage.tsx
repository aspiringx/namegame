import { getGroup } from './data'
import CommunityGroupPageClient from './CommunityGroupPageClient'
import { notFound } from 'next/navigation'

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const groupData = await getGroup(params.slug)

  if (!groupData) {
    notFound()
  }

  return <CommunityGroupPageClient groupData={groupData} view="grid" />
}
