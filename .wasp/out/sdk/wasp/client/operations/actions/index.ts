import { type ActionFor, createAction } from './core'
import { UpdateUser_ext } from 'wasp/server/operations/actions'
import { DeleteUser_ext } from 'wasp/server/operations/actions'
import { CreateGroup_ext } from 'wasp/server/operations/actions'
import { UpdateGroup_ext } from 'wasp/server/operations/actions'
import { DeleteGroup_ext } from 'wasp/server/operations/actions'
import { CreatePhoto_ext } from 'wasp/server/operations/actions'
import { UpdatePhoto_ext } from 'wasp/server/operations/actions'
import { DeletePhoto_ext } from 'wasp/server/operations/actions'
import { CreateMessage_ext } from 'wasp/server/operations/actions'
import { UpdateMessage_ext } from 'wasp/server/operations/actions'
import { DeleteMessage_ext } from 'wasp/server/operations/actions'
import { CreateUserUser_ext } from 'wasp/server/operations/actions'
import { UpdateUserUser_ext } from 'wasp/server/operations/actions'
import { DeleteUserUser_ext } from 'wasp/server/operations/actions'
import { JoinGroup_ext } from 'wasp/server/operations/actions'
import { LeaveGroup_ext } from 'wasp/server/operations/actions'
import { UpdateUserRole_ext } from 'wasp/server/operations/actions'
import { CreateCode_ext } from 'wasp/server/operations/actions'
import { UpdateCode_ext } from 'wasp/server/operations/actions'
import { DeleteCode_ext } from 'wasp/server/operations/actions'
import { CreateGreeting_ext } from 'wasp/server/operations/actions'
import { UpdateGreeting_ext } from 'wasp/server/operations/actions'
import { DeleteGreeting_ext } from 'wasp/server/operations/actions'
import { CreateLink_ext } from 'wasp/server/operations/actions'
import { UpdateLink_ext } from 'wasp/server/operations/actions'
import { DeleteLink_ext } from 'wasp/server/operations/actions'
import { CreateIceBreaker_ext } from 'wasp/server/operations/actions'
import { UpdateIceBreaker_ext } from 'wasp/server/operations/actions'
import { DeleteIceBreaker_ext } from 'wasp/server/operations/actions'

// PUBLIC API
export const updateUser: ActionFor<UpdateUser_ext> = createAction<UpdateUser_ext>(
  'operations/update-user',
  ['User'],
)

// PUBLIC API
export const deleteUser: ActionFor<DeleteUser_ext> = createAction<DeleteUser_ext>(
  'operations/delete-user',
  ['User'],
)

// PUBLIC API
export const createGroup: ActionFor<CreateGroup_ext> = createAction<CreateGroup_ext>(
  'operations/create-group',
  ['Group', 'GroupUser'],
)

// PUBLIC API
export const updateGroup: ActionFor<UpdateGroup_ext> = createAction<UpdateGroup_ext>(
  'operations/update-group',
  ['Group', 'GroupUser'],
)

// PUBLIC API
export const deleteGroup: ActionFor<DeleteGroup_ext> = createAction<DeleteGroup_ext>(
  'operations/delete-group',
  ['Group', 'GroupUser'],
)

// PUBLIC API
export const createPhoto: ActionFor<CreatePhoto_ext> = createAction<CreatePhoto_ext>(
  'operations/create-photo',
  ['Photo', 'User', 'Group', 'GroupUser'],
)

// PUBLIC API
export const updatePhoto: ActionFor<UpdatePhoto_ext> = createAction<UpdatePhoto_ext>(
  'operations/update-photo',
  ['Photo', 'User', 'Group', 'GroupUser'],
)

// PUBLIC API
export const deletePhoto: ActionFor<DeletePhoto_ext> = createAction<DeletePhoto_ext>(
  'operations/delete-photo',
  ['Photo', 'User', 'Group', 'GroupUser'],
)

// PUBLIC API
export const createMessage: ActionFor<CreateMessage_ext> = createAction<CreateMessage_ext>(
  'operations/create-message',
  ['Message'],
)

// PUBLIC API
export const updateMessage: ActionFor<UpdateMessage_ext> = createAction<UpdateMessage_ext>(
  'operations/update-message',
  ['Message'],
)

// PUBLIC API
export const deleteMessage: ActionFor<DeleteMessage_ext> = createAction<DeleteMessage_ext>(
  'operations/delete-message',
  ['Message'],
)

// PUBLIC API
export const createUserUser: ActionFor<CreateUserUser_ext> = createAction<CreateUserUser_ext>(
  'operations/create-user-user',
  ['UserUser', 'GroupUser'],
)

// PUBLIC API
export const updateUserUser: ActionFor<UpdateUserUser_ext> = createAction<UpdateUserUser_ext>(
  'operations/update-user-user',
  ['UserUser', 'GroupUser'],
)

// PUBLIC API
export const deleteUserUser: ActionFor<DeleteUserUser_ext> = createAction<DeleteUserUser_ext>(
  'operations/delete-user-user',
  ['UserUser', 'GroupUser'],
)

// PUBLIC API
export const joinGroup: ActionFor<JoinGroup_ext> = createAction<JoinGroup_ext>(
  'operations/join-group',
  ['GroupUser', 'Code', 'Group'],
)

// PUBLIC API
export const leaveGroup: ActionFor<LeaveGroup_ext> = createAction<LeaveGroup_ext>(
  'operations/leave-group',
  ['GroupUser'],
)

// PUBLIC API
export const updateUserRole: ActionFor<UpdateUserRole_ext> = createAction<UpdateUserRole_ext>(
  'operations/update-user-role',
  ['GroupUser'],
)

// PUBLIC API
export const createCode: ActionFor<CreateCode_ext> = createAction<CreateCode_ext>(
  'operations/create-code',
  ['Code', 'User', 'Group', 'GroupUser'],
)

// PUBLIC API
export const updateCode: ActionFor<UpdateCode_ext> = createAction<UpdateCode_ext>(
  'operations/update-code',
  ['Code', 'User', 'Group', 'GroupUser'],
)

// PUBLIC API
export const deleteCode: ActionFor<DeleteCode_ext> = createAction<DeleteCode_ext>(
  'operations/delete-code',
  ['Code', 'User', 'Group', 'GroupUser'],
)

// PUBLIC API
export const createGreeting: ActionFor<CreateGreeting_ext> = createAction<CreateGreeting_ext>(
  'operations/create-greeting',
  ['Greeting', 'UserUser'],
)

// PUBLIC API
export const updateGreeting: ActionFor<UpdateGreeting_ext> = createAction<UpdateGreeting_ext>(
  'operations/update-greeting',
  ['Greeting', 'UserUser'],
)

// PUBLIC API
export const deleteGreeting: ActionFor<DeleteGreeting_ext> = createAction<DeleteGreeting_ext>(
  'operations/delete-greeting',
  ['Greeting', 'UserUser'],
)

// PUBLIC API
export const createLink: ActionFor<CreateLink_ext> = createAction<CreateLink_ext>(
  'operations/create-link',
  ['Link', 'Group', 'GroupUser'],
)

// PUBLIC API
export const updateLink: ActionFor<UpdateLink_ext> = createAction<UpdateLink_ext>(
  'operations/update-link',
  ['Link', 'Group', 'GroupUser'],
)

// PUBLIC API
export const deleteLink: ActionFor<DeleteLink_ext> = createAction<DeleteLink_ext>(
  'operations/delete-link',
  ['Link', 'Group', 'GroupUser'],
)

// PUBLIC API
export const createIceBreaker: ActionFor<CreateIceBreaker_ext> = createAction<CreateIceBreaker_ext>(
  'operations/create-ice-breaker',
  ['IceBreaker', 'GroupUser'],
)

// PUBLIC API
export const updateIceBreaker: ActionFor<UpdateIceBreaker_ext> = createAction<UpdateIceBreaker_ext>(
  'operations/update-ice-breaker',
  ['IceBreaker', 'GroupUser'],
)

// PUBLIC API
export const deleteIceBreaker: ActionFor<DeleteIceBreaker_ext> = createAction<DeleteIceBreaker_ext>(
  'operations/delete-ice-breaker',
  ['IceBreaker', 'GroupUser'],
)
