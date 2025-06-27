import { HttpError } from 'wasp/server';
import type { UserUser, UserUserRelationType } from '@prisma/client';
import type { CreateUserUser, UpdateUserUser, DeleteUserUser } from 'wasp/server/operations';
import { ensureUserIsMemberOfGroup } from './auth.js';

type UserUserPayload = { user1Id: number; user2Id: number; groupId: number };

type CreateUserUserPayload = UserUserPayload & { relationType?: UserUserRelationType };
export const createUserUser: CreateUserUser<CreateUserUserPayload, UserUser> = async (args, context) => {
  const user = await ensureUserIsMemberOfGroup(context, { groupId: args.groupId });
  if (user.id !== args.user1Id && user.id !== args.user2Id) {
    throw new HttpError(403, 'User must be part of the relation');
  }
  const { user1Id, user2Id, groupId, ...data } = args;
  return context.entities.UserUser.create({
    data: {
      ...data,
      user1: { connect: { id: user1Id } },
      user2: { connect: { id: user2Id } },
      group: { connect: { id: groupId } },
    },
  });
};

type UpdateUserUserPayload = UserUserPayload & { relationType: UserUserRelationType };
export const updateUserUser: UpdateUserUser<UpdateUserUserPayload, UserUser> = async (args, context) => {
  const user = await ensureUserIsMemberOfGroup(context, { groupId: args.groupId });
  if (user.id !== args.user1Id && user.id !== args.user2Id) {
    throw new HttpError(403, 'User must be part of the relation');
  }
  const { user1Id, user2Id, groupId, ...data } = args;
  return context.entities.UserUser.update({
    where: { user1Id_user2Id_groupId: { user1Id, user2Id, groupId } },
    data,
  });
};

type DeleteUserUserPayload = UserUserPayload;
export const deleteUserUser: DeleteUserUser<DeleteUserUserPayload, UserUser> = async (args, context) => {
  const user = await ensureUserIsMemberOfGroup(context, { groupId: args.groupId });
  if (user.id !== args.user1Id && user.id !== args.user2Id) {
    throw new HttpError(403, 'User must be part of the relation');
  }
  return context.entities.UserUser.delete({
    where: { user1Id_user2Id_groupId: args },
  });
};
