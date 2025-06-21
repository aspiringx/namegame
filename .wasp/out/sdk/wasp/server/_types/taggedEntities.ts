// Wasp internally uses the types defined in this file for typing entity maps in
// operation contexts.
//
// We must explicitly tag all entities with their name to avoid issues with
// structural typing. See https://github.com/wasp-lang/wasp/pull/982 for details.
import { 
  type Entity, 
  type EntityName,
  type User,
  type Group,
  type Code,
  type Photo,
  type Message,
  type Greeting,
  type IceBreaker,
  type Link,
} from 'wasp/entities'

export type _User = WithName<User, "User">
export type _Group = WithName<Group, "Group">
export type _Code = WithName<Code, "Code">
export type _Photo = WithName<Photo, "Photo">
export type _Message = WithName<Message, "Message">
export type _Greeting = WithName<Greeting, "Greeting">
export type _IceBreaker = WithName<IceBreaker, "IceBreaker">
export type _Link = WithName<Link, "Link">

export type _Entity = 
  | _User
  | _Group
  | _Code
  | _Photo
  | _Message
  | _Greeting
  | _IceBreaker
  | _Link
  | never

type WithName<E extends Entity, Name extends EntityName> = 
  E & { _entityName: Name }
