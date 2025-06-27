import { type QueryFor, createQuery } from './core'
import { GetUser_ext } from 'wasp/server/operations/queries'
import { GetUsers_ext } from 'wasp/server/operations/queries'
import { GetGroup_ext } from 'wasp/server/operations/queries'
import { GetGroups_ext } from 'wasp/server/operations/queries'
import { GetPhoto_ext } from 'wasp/server/operations/queries'
import { GetPhotos_ext } from 'wasp/server/operations/queries'
import { GetMessage_ext } from 'wasp/server/operations/queries'
import { GetMessages_ext } from 'wasp/server/operations/queries'
import { GetCode_ext } from 'wasp/server/operations/queries'
import { GetCodes_ext } from 'wasp/server/operations/queries'
import { GetGreeting_ext } from 'wasp/server/operations/queries'
import { GetGreetings_ext } from 'wasp/server/operations/queries'
import { GetLink_ext } from 'wasp/server/operations/queries'
import { GetLinks_ext } from 'wasp/server/operations/queries'
import { GetIceBreaker_ext } from 'wasp/server/operations/queries'
import { GetIceBreakers_ext } from 'wasp/server/operations/queries'

// PUBLIC API
export const getUser: QueryFor<GetUser_ext> = createQuery<GetUser_ext>(
  'operations/get-user',
  ['User'],
)

// PUBLIC API
export const getUsers: QueryFor<GetUsers_ext> = createQuery<GetUsers_ext>(
  'operations/get-users',
  ['User'],
)

// PUBLIC API
export const getGroup: QueryFor<GetGroup_ext> = createQuery<GetGroup_ext>(
  'operations/get-group',
  ['Group', 'User', 'GroupUser', 'Photo', 'Message', 'Link', 'IceBreaker'],
)

// PUBLIC API
export const getGroups: QueryFor<GetGroups_ext> = createQuery<GetGroups_ext>(
  'operations/get-groups',
  ['Group'],
)

// PUBLIC API
export const getPhoto: QueryFor<GetPhoto_ext> = createQuery<GetPhoto_ext>(
  'operations/get-photo',
  ['Photo', 'User', 'Group'],
)

// PUBLIC API
export const getPhotos: QueryFor<GetPhotos_ext> = createQuery<GetPhotos_ext>(
  'operations/get-photos',
  ['Photo', 'User', 'Group'],
)

// PUBLIC API
export const getMessage: QueryFor<GetMessage_ext> = createQuery<GetMessage_ext>(
  'operations/get-message',
  ['Message', 'User', 'Group'],
)

// PUBLIC API
export const getMessages: QueryFor<GetMessages_ext> = createQuery<GetMessages_ext>(
  'operations/get-messages',
  ['Message', 'User', 'Group'],
)

// PUBLIC API
export const getCode: QueryFor<GetCode_ext> = createQuery<GetCode_ext>(
  'operations/get-code',
  ['Code', 'User', 'Group'],
)

// PUBLIC API
export const getCodes: QueryFor<GetCodes_ext> = createQuery<GetCodes_ext>(
  'operations/get-codes',
  ['Code', 'User', 'Group'],
)

// PUBLIC API
export const getGreeting: QueryFor<GetGreeting_ext> = createQuery<GetGreeting_ext>(
  'operations/get-greeting',
  ['Greeting', 'UserUser'],
)

// PUBLIC API
export const getGreetings: QueryFor<GetGreetings_ext> = createQuery<GetGreetings_ext>(
  'operations/get-greetings',
  ['Greeting', 'UserUser'],
)

// PUBLIC API
export const getLink: QueryFor<GetLink_ext> = createQuery<GetLink_ext>(
  'operations/get-link',
  ['Link', 'Group'],
)

// PUBLIC API
export const getLinks: QueryFor<GetLinks_ext> = createQuery<GetLinks_ext>(
  'operations/get-links',
  ['Link', 'Group'],
)

// PUBLIC API
export const getIceBreaker: QueryFor<GetIceBreaker_ext> = createQuery<GetIceBreaker_ext>(
  'operations/get-ice-breaker',
  ['IceBreaker', 'User', 'Group'],
)

// PUBLIC API
export const getIceBreakers: QueryFor<GetIceBreakers_ext> = createQuery<GetIceBreakers_ext>(
  'operations/get-ice-breakers',
  ['IceBreaker', 'User', 'Group'],
)

// PRIVATE API (used in SDK)
export { buildAndRegisterQuery } from './core'
