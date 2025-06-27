import { HttpError } from 'wasp/server';
import type { Message } from '@prisma/client';
import type { CreateMessage, UpdateMessage, DeleteMessage } from 'wasp/server/operations';
import { ensureUserIsAuthenticated } from './auth.js';

type CreateMessagePayload = {
  message: string;
  entityType: string;
  entityId: number;
  recipientId: number;
  recipientType: string;
};

export const createMessage: CreateMessage<CreateMessagePayload, Message> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  return context.entities.Message.create({
    data: {
      ...args,
      user: { connect: { id: user.id } },
    },
  });
};

type UpdateMessagePayload = { id: number; message: string; isBlocked: boolean };
export const updateMessage: UpdateMessage<UpdateMessagePayload, Message> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const message = await context.entities.Message.findUniqueOrThrow({ where: { id: args.id } });
  if (message.userId !== user.id) {
    throw new HttpError(403, 'User can only update their own messages');
  }
  const { id, ...data } = args;
  return context.entities.Message.update({ where: { id }, data });
};

type DeleteMessagePayload = Pick<Message, 'id'>;
export const deleteMessage: DeleteMessage<DeleteMessagePayload, Message> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const message = await context.entities.Message.findUniqueOrThrow({ where: { id: args.id } });
  if (message.userId !== user.id) {
    throw new HttpError(403, 'User can only delete their own messages');
  }
  return context.entities.Message.delete({ where: { id: args.id } });
};
