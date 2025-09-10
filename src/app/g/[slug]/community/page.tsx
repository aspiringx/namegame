import { getGroup } from './data'
import CommunityGroupPageClient from './CommunityGroupPageClient'
import { notFound } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const groupData = await getGroup(slug)

  if (!groupData) {
    notFound()
  }

  return <CommunityGroupPageClient groupData={groupData} />
}
