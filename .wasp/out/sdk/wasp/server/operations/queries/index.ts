
import { prisma } from 'wasp/server'
import {
  type UnauthenticatedOperationFor,
  createUnauthenticatedOperation,
  type AuthenticatedOperationFor,
  createAuthenticatedOperation,
} from '../wrappers.js'
import { getUser as getUser_ext } from 'wasp/src/queries'
import { getUsers as getUsers_ext } from 'wasp/src/queries'
import { getGroup as getGroup_ext } from 'wasp/src/queries'
import { getGroups as getGroups_ext } from 'wasp/src/queries'
import { getPhoto as getPhoto_ext } from 'wasp/src/queries'
import { getPhotos as getPhotos_ext } from 'wasp/src/queries'
import { getMessage as getMessage_ext } from 'wasp/src/queries'
import { getMessages as getMessages_ext } from 'wasp/src/queries'
import { getCode as getCode_ext } from 'wasp/src/queries'
import { getCodes as getCodes_ext } from 'wasp/src/queries'
import { getGreeting as getGreeting_ext } from 'wasp/src/queries'
import { getGreetings as getGreetings_ext } from 'wasp/src/queries'
import { getLink as getLink_ext } from 'wasp/src/queries'
import { getLinks as getLinks_ext } from 'wasp/src/queries'
import { getIceBreaker as getIceBreaker_ext } from 'wasp/src/queries'
import { getIceBreakers as getIceBreakers_ext } from 'wasp/src/queries'

// PRIVATE API
export type GetUser_ext = typeof getUser_ext

// PUBLIC API
export const getUser: AuthenticatedOperationFor<GetUser_ext> =
  createAuthenticatedOperation(
    getUser_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetUsers_ext = typeof getUsers_ext

// PUBLIC API
export const getUsers: AuthenticatedOperationFor<GetUsers_ext> =
  createAuthenticatedOperation(
    getUsers_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetGroup_ext = typeof getGroup_ext

// PUBLIC API
export const getGroup: AuthenticatedOperationFor<GetGroup_ext> =
  createAuthenticatedOperation(
    getGroup_ext,
    {
      Group: prisma.group,
      User: prisma.user,
      GroupUser: prisma.groupUser,
      Photo: prisma.photo,
      Message: prisma.message,
      Link: prisma.link,
      IceBreaker: prisma.iceBreaker,
    },
  )


// PRIVATE API
export type GetGroups_ext = typeof getGroups_ext

// PUBLIC API
export const getGroups: AuthenticatedOperationFor<GetGroups_ext> =
  createAuthenticatedOperation(
    getGroups_ext,
    {
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetPhoto_ext = typeof getPhoto_ext

// PUBLIC API
export const getPhoto: AuthenticatedOperationFor<GetPhoto_ext> =
  createAuthenticatedOperation(
    getPhoto_ext,
    {
      Photo: prisma.photo,
      User: prisma.user,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetPhotos_ext = typeof getPhotos_ext

// PUBLIC API
export const getPhotos: AuthenticatedOperationFor<GetPhotos_ext> =
  createAuthenticatedOperation(
    getPhotos_ext,
    {
      Photo: prisma.photo,
      User: prisma.user,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetMessage_ext = typeof getMessage_ext

// PUBLIC API
export const getMessage: AuthenticatedOperationFor<GetMessage_ext> =
  createAuthenticatedOperation(
    getMessage_ext,
    {
      Message: prisma.message,
      User: prisma.user,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetMessages_ext = typeof getMessages_ext

// PUBLIC API
export const getMessages: AuthenticatedOperationFor<GetMessages_ext> =
  createAuthenticatedOperation(
    getMessages_ext,
    {
      Message: prisma.message,
      User: prisma.user,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetCode_ext = typeof getCode_ext

// PUBLIC API
export const getCode: AuthenticatedOperationFor<GetCode_ext> =
  createAuthenticatedOperation(
    getCode_ext,
    {
      Code: prisma.code,
      User: prisma.user,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetCodes_ext = typeof getCodes_ext

// PUBLIC API
export const getCodes: AuthenticatedOperationFor<GetCodes_ext> =
  createAuthenticatedOperation(
    getCodes_ext,
    {
      Code: prisma.code,
      User: prisma.user,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetGreeting_ext = typeof getGreeting_ext

// PUBLIC API
export const getGreeting: AuthenticatedOperationFor<GetGreeting_ext> =
  createAuthenticatedOperation(
    getGreeting_ext,
    {
      Greeting: prisma.greeting,
      UserUser: prisma.userUser,
    },
  )


// PRIVATE API
export type GetGreetings_ext = typeof getGreetings_ext

// PUBLIC API
export const getGreetings: AuthenticatedOperationFor<GetGreetings_ext> =
  createAuthenticatedOperation(
    getGreetings_ext,
    {
      Greeting: prisma.greeting,
      UserUser: prisma.userUser,
    },
  )


// PRIVATE API
export type GetLink_ext = typeof getLink_ext

// PUBLIC API
export const getLink: AuthenticatedOperationFor<GetLink_ext> =
  createAuthenticatedOperation(
    getLink_ext,
    {
      Link: prisma.link,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetLinks_ext = typeof getLinks_ext

// PUBLIC API
export const getLinks: AuthenticatedOperationFor<GetLinks_ext> =
  createAuthenticatedOperation(
    getLinks_ext,
    {
      Link: prisma.link,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetIceBreaker_ext = typeof getIceBreaker_ext

// PUBLIC API
export const getIceBreaker: AuthenticatedOperationFor<GetIceBreaker_ext> =
  createAuthenticatedOperation(
    getIceBreaker_ext,
    {
      IceBreaker: prisma.iceBreaker,
      User: prisma.user,
      Group: prisma.group,
    },
  )


// PRIVATE API
export type GetIceBreakers_ext = typeof getIceBreakers_ext

// PUBLIC API
export const getIceBreakers: AuthenticatedOperationFor<GetIceBreakers_ext> =
  createAuthenticatedOperation(
    getIceBreakers_ext,
    {
      IceBreaker: prisma.iceBreaker,
      User: prisma.user,
      Group: prisma.group,
    },
  )

