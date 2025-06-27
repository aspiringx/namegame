import { HttpError } from 'wasp/server';
import type { User, GroupUser } from '@prisma/client';

export const ensureUserIsAuthenticated = (context: { user?: User }): User => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authenticated');
  }
  return context.user;
};

export const ensureUserIsMemberOfGroup = async (
  context: { entities: { GroupUser: any }; user?: User },
  args: { groupId: number }
): Promise<User> => {
  const user = ensureUserIsAuthenticated(context);
  const membership = await context.entities.GroupUser.findFirst({
    where: { userId: user.id, groupId: args.groupId },
  });
  if (!membership) {
    throw new HttpError(403, 'User is not a member of this group');
  }
  return user;
};

export const ensureUserIsAdminOfGroup = async (
  context: { entities: { GroupUser: any }; user?: User },
  args: { groupId: number }
): Promise<User> => {
  const user = await ensureUserIsMemberOfGroup(context, args);
  const membership = await context.entities.GroupUser.findFirstOrThrow({
    where: { userId: user.id, groupId: args.groupId },
  });
  if (membership.role !== 'admin' && membership.role !== 'owner') {
    throw new HttpError(403, 'User is not an admin of this group');
  }
  return user;
};
