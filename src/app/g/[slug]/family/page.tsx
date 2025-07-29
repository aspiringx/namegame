import { getGroup } from './data';
import { FamilyGroupClient } from './FamilyGroupClient';
import { notFound } from 'next/navigation';

// This will be the custom page for family groups.
// For now, it's a simple placeholder.
export default async function FamilyGroupPage({ params }: { params: { slug: string } }) {
  const group = await getGroup(params.slug);

  if (!group) {
    notFound();
  }

  return (
    <FamilyGroupClient
      initialMembers={group.members}
      groupSlug={params.slug}
      initialMemberCount={group.memberCount}
    />
  );
}
