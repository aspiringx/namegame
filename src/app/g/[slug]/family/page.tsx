import { getGroup } from './data';
import { FamilyGroupClient } from './FamilyGroupClient';
import { notFound } from 'next/navigation';

// This will be the custom page for family groups.
// For now, it's a simple placeholder.
export default async function FamilyGroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  return (
    <FamilyGroupClient
      initialMembers={group.members}
      groupSlug={slug}
      initialMemberCount={group.memberCount}
    />
  );
}
