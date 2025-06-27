import { nanoid } from 'nanoid';
import type { Code } from '@prisma/client';
import type { CreateCode, UpdateCode, DeleteCode } from 'wasp/server/operations';
import { ensureUserIsAuthenticated, ensureUserIsAdminOfGroup } from './auth.js';

type CreateCodePayload = { groupId: number; parentGroupId: number; geo?: string };
export const createCode: CreateCode<CreateCodePayload, Code> = async (args, context) => {
  const user = await ensureUserIsAdminOfGroup(context, { groupId: args.groupId });
  const { groupId, ...data } = args;
  return context.entities.Code.create({
    data: {
      ...data,
      url: nanoid(8),
      user: { connect: { id: user.id } },
      group: { connect: { id: groupId } },
    },
  });
};

type UpdateCodePayload = { id: number; url: string };
export const updateCode: UpdateCode<UpdateCodePayload, Code> = async (args, context) => {
  const code = await context.entities.Code.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsAdminOfGroup(context, { groupId: code.groupId });
  const { id, ...data } = args;
  return context.entities.Code.update({ where: { id }, data });
};

type DeleteCodePayload = Pick<Code, 'id'>;
export const deleteCode: DeleteCode<DeleteCodePayload, Code> = async (args, context) => {
  const code = await context.entities.Code.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsAdminOfGroup(context, { groupId: code.groupId });
  return context.entities.Code.delete({ where: { id: args.id } });
};
