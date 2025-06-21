import { HttpError } from 'wasp/server'
import { 
  type GetUser, type GetUsers, type GetGroup, type GetGroups, type GetLink, type GetLinks, type GetCode, type GetCodes, 
  type GetPhoto, type GetPhotos, type GetMessage, type GetMessages, type GetGreeting, type GetGreetings, 
  type GetIceBreaker, type GetIceBreakers 
} from 'wasp/server/operations'
import { 
  type User, type Group, type Link, type Code, type Photo, 
  type Message, type Greeting, type IceBreaker 
} from '@prisma/client'

// TODO: Add input validation to all queries.
// TODO: Add pagination to all queries that return lists.

// User Queries
type GetUserInput = { id: number }
export const getUser: GetUser<GetUserInput, User | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.User.findUnique({ where: { id } })
}

export const getUsers: GetUsers<void, User[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.User.findMany()
}


// Group Queries
type GetGroupInput = { id: number }
export const getGroup: GetGroup<GetGroupInput, Group | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Group.findUnique({ where: { id } })
}

export const getGroups: GetGroups<void, Group[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Group.findMany()
}

// Link Queries
type GetLinkInput = { id: number }
export const getLink: GetLink<GetLinkInput, Link | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Link.findUnique({ where: { id } })
}

export const getLinks: GetLinks<void, Link[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Link.findMany()
}

// Code Queries
type GetCodeInput = { id: number }
export const getCode: GetCode<GetCodeInput, Code | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Code.findUnique({ where: { id } })
}

export const getCodes: GetCodes<void, Code[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Code.findMany()
}

// Photo Queries
type GetPhotoInput = { id: number }
export const getPhoto: GetPhoto<GetPhotoInput, Photo | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Photo.findUnique({ where: { id } })
}

export const getPhotos: GetPhotos<void, Photo[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Photo.findMany()
}

// Message Queries
type GetMessageInput = { id: number }
export const getMessage: GetMessage<GetMessageInput, Message | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Message.findUnique({ where: { id } })
}

export const getMessages: GetMessages<void, Message[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Message.findMany()
}

// Greeting Queries
type GetGreetingInput = { id: number }
export const getGreeting: GetGreeting<GetGreetingInput, Greeting | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Greeting.findUnique({ where: { id } })
}

export const getGreetings: GetGreetings<void, Greeting[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.Greeting.findMany()
}

// IceBreaker Queries
type GetIceBreakerInput = { id: number }
export const getIceBreaker: GetIceBreaker<GetIceBreakerInput, IceBreaker | null> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.IceBreaker.findUnique({ where: { id } })
}

export const getIceBreakers: GetIceBreakers<void, IceBreaker[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  return context.entities.IceBreaker.findMany()
}
