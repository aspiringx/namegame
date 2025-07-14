import { getGroup } from './data';
import GroupPageClient from './GroupPageClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string };
}

export default async function Page(props: { params: { slug: string } }) {
  // In newer Next.js versions, params for dynamic routes must be awaited.
  const { slug } = await props.params;
  const groupData = await getGroup(slug);

  if (!groupData) {
    notFound();
  }

  return <GroupPageClient groupData={groupData} />;
}
