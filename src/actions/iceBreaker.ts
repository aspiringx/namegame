import type { IceBreaker } from '@prisma/client';
import type { CreateIceBreaker, UpdateIceBreaker, DeleteIceBreaker } from 'wasp/server/operations';
import { ensureUserIsAdminOfGroup } from './auth.js';

type CreateIceBreakerPayload = { groupId: number; question: string };
export const createIceBreaker: CreateIceBreaker<CreateIceBreakerPayload, IceBreaker> = async (args, context) => {
  await ensureUserIsAdminOfGroup(context, { groupId: args.groupId });
  const { groupId, ...data } = args;
  return context.entities.IceBreaker.create({
    data: {
      ...data,
      group: { connect: { id: groupId } },
    },
  });
};

type UpdateIceBreakerPayload = { id: number; question: string };
export const updateIceBreaker: UpdateIceBreaker<UpdateIceBreakerPayload, IceBreaker> = async (args, context) => {
  const iceBreaker = await context.entities.IceBreaker.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsAdminOfGroup(context, { groupId: iceBreaker.groupId });
  const { id, ...data } = args;
  return context.entities.IceBreaker.update({ where: { id }, data });
};

type DeleteIceBreakerPayload = Pick<IceBreaker, 'id'>;
export const deleteIceBreaker: DeleteIceBreaker<DeleteIceBreakerPayload, IceBreaker> = async (args, context) => {
  const iceBreaker = await context.entities.IceBreaker.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsAdminOfGroup(context, { groupId: iceBreaker.groupId });
  return context.entities.IceBreaker.delete({ where: { id: args.id } });
};
