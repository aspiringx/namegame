import { HttpError } from 'wasp/server';
import type { Greeting } from '@prisma/client';
import type { CreateGreeting, UpdateGreeting, DeleteGreeting } from 'wasp/server/operations';
import { ensureUserIsAuthenticated } from './auth.js';

type CreateGreetingPayload = { user1Id: number; user2Id: number; geo?: string };
export const createGreeting: CreateGreeting<CreateGreetingPayload, Greeting> = async (args, context) => {
  ensureUserIsAuthenticated(context);
  return context.entities.Greeting.create({
    data: {
      user1: { connect: { id: args.user1Id } },
      user2: { connect: { id: args.user2Id } },
      geo: args.geo,
    },
  });
};

type UpdateGreetingPayload = { id: number; geo?: string };
export const updateGreeting: UpdateGreeting<UpdateGreetingPayload, Greeting> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const greeting = await context.entities.Greeting.findUniqueOrThrow({ where: { id: args.id } });
  if (greeting.user1Id !== user.id) {
    throw new HttpError(403, 'User can only update their own greetings');
  }
  const { id, ...data } = args;
  return context.entities.Greeting.update({ where: { id }, data });
};

type DeleteGreetingPayload = Pick<Greeting, 'id'>;
export const deleteGreeting: DeleteGreeting<DeleteGreetingPayload, Greeting> = async (args, context) => {
  const user = ensureUserIsAuthenticated(context);
  const greeting = await context.entities.Greeting.findUniqueOrThrow({ where: { id: args.id } });
  if (greeting.user1Id !== user.id) {
    throw new HttpError(403, 'User can only update their own greetings');
  }
  return context.entities.Greeting.delete({ where: { id: args.id } });
};
