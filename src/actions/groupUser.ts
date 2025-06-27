import { HttpError } from 'wasp/server';
import type { GroupUser, GroupUserRole } from '@prisma/client';
import type { JoinGroup, LeaveGroup, UpdateUserRole } from 'wasp/server/operations';
import { ensureUserIsAuthenticated, ensureUserIsAdminOfGroup } from './auth.js';

type JoinGroupPayload = { url: string };
export const joinGroup: JoinGroup<JoinGroupPayload, GroupUser> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const code = await context.entities.Code.findUniqueOrThrow({ where: { url: args.url } });
  const group = await context.entities.Group.findUniqueOrThrow({ where: { id: code.groupId } });

  return context.entities.GroupUser.create({
    data: {
      user: { connect: { id: user.id } },
      group: { connect: { id: group.id } },
      role: 'member',
    },
  });
};

type LeaveGroupPayload = { groupId: number };
export const leaveGroup: LeaveGroup<LeaveGroupPayload, GroupUser> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const membership = await context.entities.GroupUser.findUniqueOrThrow({
    where: { userId_groupId: { userId: user.id, groupId: args.groupId } },
  });
  if (membership.role === 'owner') {
    throw new HttpError(403, 'Owner cannot leave the group');
  }
  return context.entities.GroupUser.delete({ where: { userId_groupId: { userId: user.id, groupId: args.groupId } } });
};

type UpdateUserRolePayload = { userId: number; groupId: number; role: GroupUserRole };
export const updateUserRole: UpdateUserRole<UpdateUserRolePayload, GroupUser> = async (args, context) => {
  await ensureUserIsAdminOfGroup(context, { groupId: args.groupId });
  const { userId, groupId, role } = args;
  return context.entities.GroupUser.update({
    where: { userId_groupId: { userId, groupId } },
    data: { role },
  });
};
