'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth-utils';
import { auth } from '@/auth';

export async function removeMember({ userId, groupId }: { userId: string, groupId: number }, groupSlug: string) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('You must be logged in to perform this action.');
  }

  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    throw new Error('Group not found.');
  }

  if (!(await isAdmin(user.id, group.id))) {
    throw new Error('You do not have permission to perform this action.');
  }

  try {
        await prisma.groupUser.delete({
      where: { userId_groupId: { userId, groupId } },
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to remove member.');
  }

  revalidatePath(`/g/${groupSlug}/admin/members`);
}
