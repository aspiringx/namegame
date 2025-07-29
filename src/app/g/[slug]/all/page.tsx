import { getGroup } from './data';
import GroupPageClient from './GroupPageClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string };
}

export default async function Page({ params }: PageProps) {
  const groupData = await getGroup(params.slug);

  if (!groupData) {
    notFound();
  }

  return <GroupPageClient groupData={groupData} />;
}
