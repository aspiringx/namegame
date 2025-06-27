
import {
  type _User,
  type _Group,
  type _GroupUser,
  type _Photo,
  type _Message,
  type _Link,
  type _IceBreaker,
  type _Code,
  type _Greeting,
  type _UserUser,
  type AuthenticatedQueryDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type GetUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUsers<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetGroup<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Group,
      _User,
      _GroupUser,
      _Photo,
      _Message,
      _Link,
      _IceBreaker,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetGroups<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetPhoto<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Photo,
      _User,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetPhotos<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Photo,
      _User,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetMessage<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Message,
      _User,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetMessages<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Message,
      _User,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetCode<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Code,
      _User,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetCodes<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Code,
      _User,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetGreeting<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Greeting,
      _UserUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetGreetings<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Greeting,
      _UserUser,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetLink<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Link,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetLinks<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _Link,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _IceBreaker,
      _User,
      _Group,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetIceBreakers<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _IceBreaker,
      _User,
      _Group,
    ],
    Input,
    Output
  >

