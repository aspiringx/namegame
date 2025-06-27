import type { Link } from '@prisma/client';
import type { CreateLink, UpdateLink, DeleteLink } from 'wasp/server/operations';
import { ensureUserIsAdminOfGroup } from './auth.js';

type CreateLinkPayload = { groupId: number; url: string; title: string; description?: string };
export const createLink: CreateLink<CreateLinkPayload, Link> = async (args, context) => {
  await ensureUserIsAdminOfGroup(context, { groupId: args.groupId });
  const { groupId, ...data } = args;
  return context.entities.Link.create({
    data: {
      ...data,
      group: { connect: { id: groupId } },
    },
  });
};

type UpdateLinkPayload = { id: number; url?: string; title?: string; description?: string };
export const updateLink: UpdateLink<UpdateLinkPayload, Link> = async (args, context) => {
  const link = await context.entities.Link.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsAdminOfGroup(context, { groupId: link.groupId });
  const { id, ...data } = args;
  return context.entities.Link.update({ where: { id }, data });
};

type DeleteLinkPayload = Pick<Link, 'id'>;
export const deleteLink: DeleteLink<DeleteLinkPayload, Link> = async (args, context) => {
  const link = await context.entities.Link.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsAdminOfGroup(context, { groupId: link.groupId });
  return context.entities.Link.delete({ where: { id: args.id } });
};
