import { HttpError } from 'wasp/server';
import type { Photo, PhotoType } from '@prisma/client';
import type { CreatePhoto, UpdatePhoto, DeletePhoto } from 'wasp/server/operations';
import { ensureUserIsAuthenticated, ensureUserIsMemberOfGroup, ensureUserIsAdminOfGroup } from './auth.js';

type CreatePhotoPayload = { groupId: number; url: string; type: PhotoType; entityType: string; entityId: number };
export const createPhoto: CreatePhoto<CreatePhotoPayload, Photo> = async (args, context) => {
  const user = await ensureUserIsMemberOfGroup(context, { groupId: args.groupId });
  const { groupId, ...rest } = args;
  return context.entities.Photo.create({
    data: {
      ...rest,
      user: { connect: { id: user.id } },
      group: { connect: { id: groupId } },
    },
  });
};

type UpdatePhotoPayload = { id: number; url: string; type: PhotoType; isBlocked: boolean };
export const updatePhoto: UpdatePhoto<UpdatePhotoPayload, Photo> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const photo = await context.entities.Photo.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsMemberOfGroup(context, { groupId: photo.groupId });
  if (photo.userId !== user.id) {
    await ensureUserIsAdminOfGroup(context, { groupId: photo.groupId });
  }
  const { id, ...data } = args;
  return context.entities.Photo.update({ where: { id }, data });
};

type DeletePhotoPayload = Pick<Photo, 'id'>;
export const deletePhoto: DeletePhoto<DeletePhotoPayload, Photo> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const photo = await context.entities.Photo.findUniqueOrThrow({ where: { id: args.id } });
  await ensureUserIsMemberOfGroup(context, { groupId: photo.groupId });
  if (photo.userId !== user.id) {
    await ensureUserIsAdminOfGroup(context, { groupId: photo.groupId });
  }
  return context.entities.Photo.delete({ where: { id: args.id } });
};
