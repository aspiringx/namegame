import { HttpError } from 'wasp/server'
import {
  type GetUser,
  type GetUsers,
  type GetGroup,
  type GetGroups,
  type GetLink,
  type GetLinks,
  type GetCode,
  type GetCodes,
  type GetPhoto,
  type GetPhotos,
  type GetMessage,
  type GetMessages,
  type GetGreeting,
  type GetGreetings,
  type GetIceBreaker,
  type GetIceBreakers,
} from 'wasp/server/operations'
import { type User } from '@prisma/client'

// We use `any` for the context type in helper functions because Wasp generates
// a different context type for each query, and we don't want to repeat the
// logic for each one.
type WaspContext = any

// Returns the authenticated user, or throws a 401 error.
const ensureUserIsAuthenticated = (context: WaspContext): User => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.user
}

// Authorization check to ensure user is a member of a group.
async function ensureUserIsMemberOfGroup(context: WaspContext, user: User, groupId: number) {
  const membership = await context.entities.GroupUser.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  })
  if (!membership) {
    throw new HttpError(403, 'User is not a member of this group')
  }
}

export const getUser: GetUser = async ({ id }, context) => {
  ensureUserIsAuthenticated(context)
  const user = await context.entities.User.findUnique({ where: { id } })
  if (!user) {
    throw new HttpError(404)
  }
  return user
}

export const getUsers: GetUsers = async (_args, context) => {
  ensureUserIsAuthenticated(context)
  return context.entities.User.findMany()
}

export const getGroup: GetGroup = async ({ id }, context) => {
  const user = ensureUserIsAuthenticated(context)
  const group = await context.entities.Group.findUnique({ where: { id } })
  if (!group) {
    throw new HttpError(404)
  }
  await ensureUserIsMemberOfGroup(context, user, group.id)
  return group
}

export const getGroups: GetGroups = async (_args, context) => {
  const user = ensureUserIsAuthenticated(context)
  return context.entities.Group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
  })
}

export const getLink: GetLink = async ({ id }, context) => {
  const user = ensureUserIsAuthenticated(context)
  const link = await context.entities.Link.findUnique({ where: { id } })
  if (!link) {
    throw new HttpError(404)
  }
  await ensureUserIsMemberOfGroup(context, user, link.groupId)
  return link
}

export const getLinks: GetLinks = async (_args, context) => {
  const user = ensureUserIsAuthenticated(context)
  return context.entities.Link.findMany({
    where: {
      group: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
  })
}

export const getCode: GetCode = async ({ id }, context) => {
  const user = ensureUserIsAuthenticated(context)
  const code = await context.entities.Code.findUnique({ where: { id } })
  if (!code) {
    throw new HttpError(404)
  }
  await ensureUserIsMemberOfGroup(context, user, code.groupId)
  return code
}

export const getCodes: GetCodes = async (_args, context) => {
  const user = ensureUserIsAuthenticated(context)
  return context.entities.Code.findMany({
    where: {
      group: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
  })
}

export const getPhoto: GetPhoto = async ({ id }, context) => {
  const user = ensureUserIsAuthenticated(context)
  const photo = await context.entities.Photo.findUnique({ where: { id } })
  if (!photo) {
    throw new HttpError(404)
  }
  await ensureUserIsMemberOfGroup(context, user, photo.groupId)
  return photo
}

export const getPhotos: GetPhotos = async (_args, context) => {
  const user = ensureUserIsAuthenticated(context)
  return context.entities.Photo.findMany({
    where: {
      group: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
  })
}

export const getMessage: GetMessage = async ({ id }, context) => {
  const user = ensureUserIsAuthenticated(context)
  const message = await context.entities.Message.findUnique({ where: { id } })
  if (!message) {
    throw new HttpError(404)
  }
  if (message.userId !== user.id && message.recipientId !== user.id) {
    throw new HttpError(403)
  }
  return message
}

export const getMessages: GetMessages = async (_args, context) => {
  const user = ensureUserIsAuthenticated(context)
  return context.entities.Message.findMany({
    where: {
      OR: [{ userId: user.id }, { recipientId: user.id }],
    },
  })
}

export const getGreeting: GetGreeting = async ({ id }, context) => {
  const user = ensureUserIsAuthenticated(context)
  const greeting = await context.entities.Greeting.findUnique({ where: { id } })
  if (!greeting) {
    throw new HttpError(404)
  }
  if (greeting.user1Id !== user.id && greeting.user2Id !== user.id) {
    throw new HttpError(403)
  }
  return greeting
}

export const getGreetings: GetGreetings = async (_args, context) => {
  const user = ensureUserIsAuthenticated(context)
  return context.entities.Greeting.findMany({
    where: {
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
  })
}

export const getIceBreaker: GetIceBreaker = async ({ id }, context) => {
  const user = ensureUserIsAuthenticated(context)
  const iceBreaker = await context.entities.IceBreaker.findUnique({ where: { id } })
  if (!iceBreaker) {
    throw new HttpError(404)
  }
  await ensureUserIsMemberOfGroup(context, user, iceBreaker.groupId)
  return iceBreaker
}

export const getIceBreakers: GetIceBreakers = async (_args, context) => {
  const user = ensureUserIsAuthenticated(context)
  return context.entities.IceBreaker.findMany({
    where: {
      group: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
  })
}


