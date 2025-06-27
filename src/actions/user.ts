import { HttpError } from 'wasp/server';
import type { User } from '@prisma/client';
import type { UpdateUser, DeleteUser } from 'wasp/server/operations';
import { ensureUserIsAuthenticated } from './auth.js';

type UpdateUserPayload = Pick<User, 'id' | 'firstName' | 'lastName'>;
export const updateUser: UpdateUser<UpdateUserPayload, User> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  if (user.id !== args.id) {
    throw new HttpError(403, 'User can only update their own account');
  }
  const { id, ...data } = args;
  return context.entities.User.update({ where: { id }, data });
};

type DeleteUserPayload = Pick<User, 'id'>;
export const deleteUser: DeleteUser<DeleteUserPayload, User> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  if (user.id !== args.id) {
    throw new HttpError(403, 'User can only delete their own account');
  }
  return context.entities.User.delete({ where: { id: args.id } });
};