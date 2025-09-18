import { getGroupTypeBySlug } from './data'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'

const FamilyGroupPage = dynamic(() => import('./(family)/FamilyPage'))
const CommunityGroupPage = dynamic(() => import('./(community)/CommunityPage'))

export default async function GroupPage({
  params: paramsProp,
}: {
  params: Promise<{ slug: string }>
}) {
  const params = await paramsProp
  const group = await getGroupTypeBySlug(params.slug)

  if (!group) {
    notFound()
  }

  // This is a route handler for a specific group.
  if (group.groupType?.code === 'family') {
    return <FamilyGroupPage params={paramsProp} />
  }

  return <CommunityGroupPage params={paramsProp} />
}
