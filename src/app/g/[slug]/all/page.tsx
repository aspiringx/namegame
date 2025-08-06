import { getGroup } from './data';
import GroupPageClient from './GroupPageClient';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const groupData = await getGroup(slug);

  if (!groupData) {
    notFound();
  }

  return <GroupPageClient groupData={groupData} />;
}
