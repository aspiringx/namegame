'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteGroup(groupId: number) {
  try {
    // Check for child groups before attempting to delete.
    const childGroups = await prisma.group.count({
      where: { parentId: groupId },
    });

    if (childGroups > 0) {
      return {
        success: false,
        message: 'Cannot delete this group because it has child groups. Please reassign or delete them first.',
      };
    }

    await prisma.$transaction(async (tx) => {
      // First, delete all related records that have a foreign key to the Group.
      // This is necessary because the schema doesn't define cascading deletes.
      await tx.code.deleteMany({ where: { groupId } });
      await tx.link.deleteMany({ where: { groupId } });
      await tx.iceBreaker.deleteMany({ where: { groupId } });
      await tx.photo.deleteMany({ where: { groupId } });
      await tx.userUser.deleteMany({ where: { groupId } });
      await tx.groupUser.deleteMany({ where: { groupId } });

      // After all related records are deleted, the group can be safely deleted.
      await tx.group.delete({
        where: { id: groupId },
      });
    });

    revalidatePath('/admin/groups');
    return { success: true, message: 'Group deleted successfully.' };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, message: 'Failed to delete group.' };
  }
}
