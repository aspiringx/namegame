import type { Group } from '@prisma/client';
import type { CreateGroup, UpdateGroup, DeleteGroup } from 'wasp/server/operations';
import { ensureUserIsAuthenticated, ensureUserIsAdminOfGroup } from './auth.js';

type CreateGroupPayload = Pick<Group, 'name' | 'description' | 'slug' | 'idTree'>;
export const createGroup: CreateGroup<CreateGroupPayload, Group> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  return context.entities.Group.create({
    data: {
      ...args,
      members: {
        create: {
          user: { connect: { id: user.id } },
          role: 'owner',
        },
      },
    },
  });
};

type UpdateGroupPayload = Pick<Group, 'id' | 'name' | 'description'>;
export const updateGroup: UpdateGroup<UpdateGroupPayload, Group> = async (args, context) => {
  await ensureUserIsAdminOfGroup(context, { groupId: args.id });
  const { id, ...data } = args;
  return context.entities.Group.update({ where: { id }, data });
};

type DeleteGroupPayload = Pick<Group, 'id'>;
export const deleteGroup: DeleteGroup<DeleteGroupPayload, Group> = async (args, context) => {
  await ensureUserIsAdminOfGroup(context, { groupId: args.id });
  return context.entities.Group.delete({ where: { id: args.id } });
};
