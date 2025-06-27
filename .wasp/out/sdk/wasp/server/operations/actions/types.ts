import {
  type _User,
  type _Group,
  type _GroupUser,
  type _Photo,
  type _Message,
  type _UserUser,
  type _Code,
  type _Greeting,
  type _Link,
  type _IceBreaker,
  type AuthenticatedActionDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type UpdateUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateGroup<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateGroup<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteGroup<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreatePhoto<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Photo,
      _User,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdatePhoto<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Photo,
      _User,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeletePhoto<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Photo,
      _User,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateMessage<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Message,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateMessage<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Message,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteMessage<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Message,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateUserUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _UserUser,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateUserUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _UserUser,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteUserUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _UserUser,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type JoinGroup<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _GroupUser,
      _Code,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type LeaveGroup<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateUserRole<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateCode<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Code,
      _User,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateCode<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Code,
      _User,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteCode<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Code,
      _User,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateGreeting<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Greeting,
      _UserUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateGreeting<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Greeting,
      _UserUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteGreeting<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Greeting,
      _UserUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateLink<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Link,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateLink<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Link,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteLink<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _Link,
      _Group,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _IceBreaker,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _IceBreaker,
      _GroupUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _IceBreaker,
      _GroupUser,
    ],
    Input,
    Output
  >

