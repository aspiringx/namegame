'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';

export async function createGreetingCode(groupId: number) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('You must be logged in to create a greeting code.');
  }

  const newCode = await prisma.code.upsert({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: groupId,
      },
    },
    update: {
      code: createId(),
    },
    create: {
      userId: session.user.id,
      groupId: groupId,
      parentGroupId: groupId, // As per instructions
      code: createId(),
    },
  });

  return newCode;
}
