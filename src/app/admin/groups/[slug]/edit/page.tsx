import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditGroupForm from './edit-group-form';

type PageProps = {
  params: { 
    slug: string;
  };
};

export default async function EditGroupPage({ params }: PageProps) {
  const group = await prisma.group.findUnique({
    where: {
      slug: params.slug,
    },
  });

  if (!group) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Group</h1>
      <EditGroupForm group={group} />
    </div>
  );
}
