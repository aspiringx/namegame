import prisma from './prisma';

/**
 * Checks if a user has the 'admin' role for a specific group.
 * @param userId The ID of the user.
 * @param groupId The ID of the group.
 * @returns A boolean indicating whether the user is an admin for the group.
 */
export async function isAdmin(userId: string, groupId: number): Promise<boolean> {
  if (!userId || !groupId) {
    return false;
  }

  const groupUser = await prisma.groupUser.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    include: {
      role: true, // Include the role information
    },
  });

  if (!groupUser || !groupUser.role) {
    return false;
  }

  return groupUser.role.code === 'admin';
}
