import { getGroup } from './data';
import GroupPageClient from './GroupPageClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  // In newer Next.js versions, params for dynamic routes must be awaited.
  const { slug } = await params;
  const groupData = await getGroup(slug);

  if (!groupData) {
    notFound();
  }

  return <GroupPageClient groupData={groupData} />;
}
