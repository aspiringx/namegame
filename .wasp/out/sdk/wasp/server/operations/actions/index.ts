
import { prisma } from 'wasp/server'
import {
  type UnauthenticatedOperationFor,
  createUnauthenticatedOperation,
  type AuthenticatedOperationFor,
  createAuthenticatedOperation,
} from '../wrappers.js'
import { updateUser as updateUser_ext } from 'wasp/src/actions'
import { deleteUser as deleteUser_ext } from 'wasp/src/actions'
import { createGroup as createGroup_ext } from 'wasp/src/actions'
import { updateGroup as updateGroup_ext } from 'wasp/src/actions'
import { deleteGroup as deleteGroup_ext } from 'wasp/src/actions'
import { createPhoto as createPhoto_ext } from 'wasp/src/actions'
import { updatePhoto as updatePhoto_ext } from 'wasp/src/actions'
import { deletePhoto as deletePhoto_ext } from 'wasp/src/actions'
import { createMessage as createMessage_ext } from 'wasp/src/actions'
import { updateMessage as updateMessage_ext } from 'wasp/src/actions'
import { deleteMessage as deleteMessage_ext } from 'wasp/src/actions'
import { createUserUser as createUserUser_ext } from 'wasp/src/actions'
import { updateUserUser as updateUserUser_ext } from 'wasp/src/actions'
import { deleteUserUser as deleteUserUser_ext } from 'wasp/src/actions'
import { joinGroup as joinGroup_ext } from 'wasp/src/actions'
import { leaveGroup as leaveGroup_ext } from 'wasp/src/actions'
import { updateUserRole as updateUserRole_ext } from 'wasp/src/actions'
import { createCode as createCode_ext } from 'wasp/src/actions'
import { updateCode as updateCode_ext } from 'wasp/src/actions'
import { deleteCode as deleteCode_ext } from 'wasp/src/actions'
import { createGreeting as createGreeting_ext } from 'wasp/src/actions'
import { updateGreeting as updateGreeting_ext } from 'wasp/src/actions'
import { deleteGreeting as deleteGreeting_ext } from 'wasp/src/actions'
import { createLink as createLink_ext } from 'wasp/src/actions'
import { updateLink as updateLink_ext } from 'wasp/src/actions'
import { deleteLink as deleteLink_ext } from 'wasp/src/actions'
import { createIceBreaker as createIceBreaker_ext } from 'wasp/src/actions'
import { updateIceBreaker as updateIceBreaker_ext } from 'wasp/src/actions'
import { deleteIceBreaker as deleteIceBreaker_ext } from 'wasp/src/actions'

// PRIVATE API
export type UpdateUser_ext = typeof updateUser_ext

// PUBLIC API
export const updateUser: AuthenticatedOperationFor<UpdateUser_ext> =
  createAuthenticatedOperation(
    updateUser_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type DeleteUser_ext = typeof deleteUser_ext

// PUBLIC API
export const deleteUser: AuthenticatedOperationFor<DeleteUser_ext> =
  createAuthenticatedOperation(
    deleteUser_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type CreateGroup_ext = typeof createGroup_ext

// PUBLIC API
export const createGroup: AuthenticatedOperationFor<CreateGroup_ext> =
  createAuthenticatedOperation(
    createGroup_ext,
    {
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type UpdateGroup_ext = typeof updateGroup_ext

// PUBLIC API
export const updateGroup: AuthenticatedOperationFor<UpdateGroup_ext> =
  createAuthenticatedOperation(
    updateGroup_ext,
    {
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type DeleteGroup_ext = typeof deleteGroup_ext

// PUBLIC API
export const deleteGroup: AuthenticatedOperationFor<DeleteGroup_ext> =
  createAuthenticatedOperation(
    deleteGroup_ext,
    {
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type CreatePhoto_ext = typeof createPhoto_ext

// PUBLIC API
export const createPhoto: AuthenticatedOperationFor<CreatePhoto_ext> =
  createAuthenticatedOperation(
    createPhoto_ext,
    {
      Photo: prisma.photo,
      User: prisma.user,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type UpdatePhoto_ext = typeof updatePhoto_ext

// PUBLIC API
export const updatePhoto: AuthenticatedOperationFor<UpdatePhoto_ext> =
  createAuthenticatedOperation(
    updatePhoto_ext,
    {
      Photo: prisma.photo,
      User: prisma.user,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type DeletePhoto_ext = typeof deletePhoto_ext

// PUBLIC API
export const deletePhoto: AuthenticatedOperationFor<DeletePhoto_ext> =
  createAuthenticatedOperation(
    deletePhoto_ext,
    {
      Photo: prisma.photo,
      User: prisma.user,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type CreateMessage_ext = typeof createMessage_ext

// PUBLIC API
export const createMessage: AuthenticatedOperationFor<CreateMessage_ext> =
  createAuthenticatedOperation(
    createMessage_ext,
    {
      Message: prisma.message,
    },
  )

// PRIVATE API
export type UpdateMessage_ext = typeof updateMessage_ext

// PUBLIC API
export const updateMessage: AuthenticatedOperationFor<UpdateMessage_ext> =
  createAuthenticatedOperation(
    updateMessage_ext,
    {
      Message: prisma.message,
    },
  )

// PRIVATE API
export type DeleteMessage_ext = typeof deleteMessage_ext

// PUBLIC API
export const deleteMessage: AuthenticatedOperationFor<DeleteMessage_ext> =
  createAuthenticatedOperation(
    deleteMessage_ext,
    {
      Message: prisma.message,
    },
  )

// PRIVATE API
export type CreateUserUser_ext = typeof createUserUser_ext

// PUBLIC API
export const createUserUser: AuthenticatedOperationFor<CreateUserUser_ext> =
  createAuthenticatedOperation(
    createUserUser_ext,
    {
      UserUser: prisma.userUser,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type UpdateUserUser_ext = typeof updateUserUser_ext

// PUBLIC API
export const updateUserUser: AuthenticatedOperationFor<UpdateUserUser_ext> =
  createAuthenticatedOperation(
    updateUserUser_ext,
    {
      UserUser: prisma.userUser,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type DeleteUserUser_ext = typeof deleteUserUser_ext

// PUBLIC API
export const deleteUserUser: AuthenticatedOperationFor<DeleteUserUser_ext> =
  createAuthenticatedOperation(
    deleteUserUser_ext,
    {
      UserUser: prisma.userUser,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type JoinGroup_ext = typeof joinGroup_ext

// PUBLIC API
export const joinGroup: AuthenticatedOperationFor<JoinGroup_ext> =
  createAuthenticatedOperation(
    joinGroup_ext,
    {
      GroupUser: prisma.groupUser,
      Code: prisma.code,
      Group: prisma.group,
    },
  )

// PRIVATE API
export type LeaveGroup_ext = typeof leaveGroup_ext

// PUBLIC API
export const leaveGroup: AuthenticatedOperationFor<LeaveGroup_ext> =
  createAuthenticatedOperation(
    leaveGroup_ext,
    {
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type UpdateUserRole_ext = typeof updateUserRole_ext

// PUBLIC API
export const updateUserRole: AuthenticatedOperationFor<UpdateUserRole_ext> =
  createAuthenticatedOperation(
    updateUserRole_ext,
    {
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type CreateCode_ext = typeof createCode_ext

// PUBLIC API
export const createCode: AuthenticatedOperationFor<CreateCode_ext> =
  createAuthenticatedOperation(
    createCode_ext,
    {
      Code: prisma.code,
      User: prisma.user,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type UpdateCode_ext = typeof updateCode_ext

// PUBLIC API
export const updateCode: AuthenticatedOperationFor<UpdateCode_ext> =
  createAuthenticatedOperation(
    updateCode_ext,
    {
      Code: prisma.code,
      User: prisma.user,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type DeleteCode_ext = typeof deleteCode_ext

// PUBLIC API
export const deleteCode: AuthenticatedOperationFor<DeleteCode_ext> =
  createAuthenticatedOperation(
    deleteCode_ext,
    {
      Code: prisma.code,
      User: prisma.user,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type CreateGreeting_ext = typeof createGreeting_ext

// PUBLIC API
export const createGreeting: AuthenticatedOperationFor<CreateGreeting_ext> =
  createAuthenticatedOperation(
    createGreeting_ext,
    {
      Greeting: prisma.greeting,
      UserUser: prisma.userUser,
    },
  )

// PRIVATE API
export type UpdateGreeting_ext = typeof updateGreeting_ext

// PUBLIC API
export const updateGreeting: AuthenticatedOperationFor<UpdateGreeting_ext> =
  createAuthenticatedOperation(
    updateGreeting_ext,
    {
      Greeting: prisma.greeting,
      UserUser: prisma.userUser,
    },
  )

// PRIVATE API
export type DeleteGreeting_ext = typeof deleteGreeting_ext

// PUBLIC API
export const deleteGreeting: AuthenticatedOperationFor<DeleteGreeting_ext> =
  createAuthenticatedOperation(
    deleteGreeting_ext,
    {
      Greeting: prisma.greeting,
      UserUser: prisma.userUser,
    },
  )

// PRIVATE API
export type CreateLink_ext = typeof createLink_ext

// PUBLIC API
export const createLink: AuthenticatedOperationFor<CreateLink_ext> =
  createAuthenticatedOperation(
    createLink_ext,
    {
      Link: prisma.link,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type UpdateLink_ext = typeof updateLink_ext

// PUBLIC API
export const updateLink: AuthenticatedOperationFor<UpdateLink_ext> =
  createAuthenticatedOperation(
    updateLink_ext,
    {
      Link: prisma.link,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type DeleteLink_ext = typeof deleteLink_ext

// PUBLIC API
export const deleteLink: AuthenticatedOperationFor<DeleteLink_ext> =
  createAuthenticatedOperation(
    deleteLink_ext,
    {
      Link: prisma.link,
      Group: prisma.group,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type CreateIceBreaker_ext = typeof createIceBreaker_ext

// PUBLIC API
export const createIceBreaker: AuthenticatedOperationFor<CreateIceBreaker_ext> =
  createAuthenticatedOperation(
    createIceBreaker_ext,
    {
      IceBreaker: prisma.iceBreaker,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type UpdateIceBreaker_ext = typeof updateIceBreaker_ext

// PUBLIC API
export const updateIceBreaker: AuthenticatedOperationFor<UpdateIceBreaker_ext> =
  createAuthenticatedOperation(
    updateIceBreaker_ext,
    {
      IceBreaker: prisma.iceBreaker,
      GroupUser: prisma.groupUser,
    },
  )

// PRIVATE API
export type DeleteIceBreaker_ext = typeof deleteIceBreaker_ext

// PUBLIC API
export const deleteIceBreaker: AuthenticatedOperationFor<DeleteIceBreaker_ext> =
  createAuthenticatedOperation(
    deleteIceBreaker_ext,
    {
      IceBreaker: prisma.iceBreaker,
      GroupUser: prisma.groupUser,
    },
  )
