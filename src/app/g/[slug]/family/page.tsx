import { getGroup } from './data'
import { FamilyGroupClient } from './FamilyGroupClient'
import { notFound } from 'next/navigation'
import { getPublicUrl } from '@/lib/storage'
import { getFamilyRelationships } from './actions'

// This will be the custom page for family groups.
// For now, it's a simple placeholder.
export default async function FamilyGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const group = await getGroup(slug)

  if (!group) {
    notFound()
  }

  // Enhance members with pre-signed photo URLs
  const membersWithPhotoUrls = await Promise.all(
    group.members.map(async (member) => {
      const photoUrl = await getPublicUrl(member.user.photoUrl)
      return {
        ...member,
        user: {
          ...member.user,
          photoUrl: photoUrl,
        },
      }
    }),
  )

  const relationships = await getFamilyRelationships(slug)

  return (
    <FamilyGroupClient
      initialMembers={membersWithPhotoUrls}
      groupSlug={slug}
      initialMemberCount={group.memberCount}
      initialRelationships={relationships}
    />
  )
}
