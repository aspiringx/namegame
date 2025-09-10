import { getGroupTypeBySlug as getGroup } from './data'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'

const FamilyPage = dynamic(() => import('./family/page'))
const CommunityGroupsPage = dynamic(() => import('./community/page'))

export default async function GroupPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>
}) {
  const params = await paramsPromise
  const group = await getGroup(params.slug)

  if (!group) {
    notFound()
  }

  if (group.groupType?.code === 'family') {
    return <FamilyPage params={paramsPromise} />
  }

  return <CommunityGroupsPage params={paramsPromise} />
}
