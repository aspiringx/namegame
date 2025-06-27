import { type _User, type _Group, type _GroupUser, type _Photo, type _Message, type _UserUser, type _Code, type _Greeting, type _Link, type _IceBreaker, type AuthenticatedActionDefinition, type Payload } from 'wasp/server/_types';
export type UpdateUser<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User
], Input, Output>;
export type DeleteUser<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _User
], Input, Output>;
export type CreateGroup<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Group,
    _GroupUser
], Input, Output>;
export type UpdateGroup<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Group,
    _GroupUser
], Input, Output>;
export type DeleteGroup<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Group,
    _GroupUser
], Input, Output>;
export type CreatePhoto<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Photo,
    _User,
    _Group,
    _GroupUser
], Input, Output>;
export type UpdatePhoto<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Photo,
    _User,
    _Group,
    _GroupUser
], Input, Output>;
export type DeletePhoto<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Photo,
    _User,
    _Group,
    _GroupUser
], Input, Output>;
export type CreateMessage<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Message
], Input, Output>;
export type UpdateMessage<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Message
], Input, Output>;
export type DeleteMessage<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Message
], Input, Output>;
export type CreateUserUser<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _UserUser,
    _GroupUser
], Input, Output>;
export type UpdateUserUser<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _UserUser,
    _GroupUser
], Input, Output>;
export type DeleteUserUser<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _UserUser,
    _GroupUser
], Input, Output>;
export type JoinGroup<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _GroupUser,
    _Code,
    _Group
], Input, Output>;
export type LeaveGroup<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _GroupUser
], Input, Output>;
export type UpdateUserRole<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _GroupUser
], Input, Output>;
export type CreateCode<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Code,
    _User,
    _Group,
    _GroupUser
], Input, Output>;
export type UpdateCode<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Code,
    _User,
    _Group,
    _GroupUser
], Input, Output>;
export type DeleteCode<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Code,
    _User,
    _Group,
    _GroupUser
], Input, Output>;
export type CreateGreeting<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Greeting,
    _UserUser
], Input, Output>;
export type UpdateGreeting<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Greeting,
    _UserUser
], Input, Output>;
export type DeleteGreeting<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Greeting,
    _UserUser
], Input, Output>;
export type CreateLink<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Link,
    _Group,
    _GroupUser
], Input, Output>;
export type UpdateLink<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Link,
    _Group,
    _GroupUser
], Input, Output>;
export type DeleteLink<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _Link,
    _Group,
    _GroupUser
], Input, Output>;
export type CreateIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _IceBreaker,
    _GroupUser
], Input, Output>;
export type UpdateIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _IceBreaker,
    _GroupUser
], Input, Output>;
export type DeleteIceBreaker<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedActionDefinition<[
    _IceBreaker,
    _GroupUser
], Input, Output>;
