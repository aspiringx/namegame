import { type _User, type _Group, type _GroupUser, type _Photo, type _Message, type _Link, type _IceBreaker, type _Code, type _Greeting, type _UserUser, type AuthenticatedQueryDefinition, type Payload } from 'wasp/server/_types';
export type GetUser<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User
], Input, Output>;
export type GetUsers<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User
], Input, Output>;
export type GetGroup<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Group,
    _User,
    _GroupUser,
    _Photo,
    _Message,
    _Link,
    _IceBreaker
], Input, Output>;
export type GetGroups<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Group
], Input, Output>;
export type GetPhoto<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Photo,
    _User,
    _Group
], Input, Output>;
export type GetPhotos<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Photo,
    _User,
    _Group
], Input, Output>;
export type GetMessage<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Message,
    _User,
    _Group
], Input, Output>;
export type GetMessages<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Message,
    _User,
    _Group
], Input, Output>;
export type GetCode<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Code,
    _User,
    _Group
], Input, Output>;
export type GetCodes<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Code,
    _User,
    _Group
], Input, Output>;
export type GetGreeting<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Greeting,
    _UserUser
], Input, Output>;
export type GetGreetings<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Greeting,
    _UserUser
], Input, Output>;
export type GetLink<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Link,
    _Group
], Input, Output>;
export type GetLinks<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _Link,
    _Group
], Input, Output>;
export type GetIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _IceBreaker,
    _User,
    _Group
], Input, Output>;
export type GetIceBreakers<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _IceBreaker,
    _User,
    _Group
], Input, Output>;
