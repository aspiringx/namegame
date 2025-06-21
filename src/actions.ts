// import { HttpError } from 'wasp/server';
// import {
//   type CreateUser, type UpdateUser, type DeleteUser,
//   type CreateGroup, type UpdateGroup, type DeleteGroup,
//   type CreateLink, type UpdateLink, type DeleteLink,
//   type CreateCode, type UpdateCode, type DeleteCode,
//   type CreatePhoto, type UpdatePhoto, type DeletePhoto,
//   type CreateMessage, type UpdateMessage, type DeleteMessage,
//   type CreateGreeting, type UpdateGreeting, type DeleteGreeting,
//   type CreateIceBreaker, type UpdateIceBreaker, type DeleteIceBreaker
// } from 'wasp/server/operations';
// import { 
//   type User, type UserUser, type Group, type GroupUser, type Link, type Code, type Photo, type Message, type Greeting, type IceBreaker, 
//   type Prisma, EntityType, LinkType, PhotoType, GroupUserRoles, GroupType, GroupVisibility, UserUserRelationTypes
// } from '@prisma/client';

// // User Actions
// type CreateUserInput = {
//   username: string;
//   email: string;
//   name?: string | null;
//   firstName: string;
//   lastName: string;
//   bio?: string | null;
//   location?: string | null;
//   website?: string | null;
//   isAdmin?: boolean;
//   pin: string;
// };
// export const createUser: CreateUser<CreateUserInput, User> = (args, context) => {
//   return context.entities.User.create({ data: args });
// };

// type UpdateUserData = {
//   username?: string;
//   email?: string;
//   name?: string | null;
//   firstName?: string;
//   lastName?: string;
//   bio?: string | null;
//   location?: string | null;
//   website?: string | null;
//   isAdmin?: boolean;
//   pin?: string;
// };
// type UpdateUserInput = { id: number; data: UpdateUserData };
// export const updateUser: UpdateUser<UpdateUserInput, User> = async ({ id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   if (context.user.id !== id) { throw new HttpError(403, 'A user can only update their own profile.'); }
//   return context.entities.User.update({ where: { id }, data });
// };

// type DeleteUserInput = { id: number }
// export const deleteUser: DeleteUser<DeleteUserInput, User> = async ({ id }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   if (context.user.id !== id) { throw new HttpError(403, 'A user can only delete their own profile.'); }
//   return context.entities.User.delete({ where: { id } });
// };

// // Group Actions
// type CreateGroupInput = {
//   name: string;
//   description?: string;
//   type: GroupType;
//   visibility: GroupVisibility;
//   slug: string;
//   parentId?: number;
// };
// export const createGroup: CreateGroup<CreateGroupInput, Group> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Group.create({ data: { ...args, user: { connect: { id: context.user.id } } } });
// };

// type UpdateGroupData = {
//   name?: string;
//   description?: string;
//   type?: GroupType;
//   visibility?: GroupVisibility;
//   slug?: string;
//   parentId?: number;
// };
// type UpdateGroupInput = { id: number; data: UpdateGroupData };
// export const updateGroup: UpdateGroup<UpdateGroupInput, Group> = async ({ id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Group.update({ where: { id }, data });
// };

// type DeleteGroupInput = { id: number };
// export const deleteGroup: DeleteGroup<DeleteGroupInput, Group> = async ({ id }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Group.delete({ where: { id } });
// };

// // Link Actions
// type CreateLinkInput = {
//   url: string;
//   title: string;
//   description?: string | null;
//   type: LinkType;
//   entityType: EntityType;
//   entityId: number;
//   groupId?: number | null;
// };
// export const createLink: CreateLink<CreateLinkInput, Link> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Link.create({ data: { ...args, user: { connect: { id: context.user.id } } } });
// };

// type UpdateLinkData = {
//   url?: string;
//   title?: string;
//   description?: string | null;
//   type?: LinkType;
//   entityType?: EntityType;
//   entityId?: number;
//   groupId?: number | null;
// };
// type UpdateLinkInput = { id: number; data: UpdateLinkData };
// export const updateLink: UpdateLink<UpdateLinkInput, Link> = async ({ id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Link.update({ where: { id }, data });
// };

// type DeleteLinkInput = { id: number };
// export const deleteLink: DeleteLink<DeleteLinkInput, Link> = async ({ id }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Link.delete({ where: { id } });
// };

// // Code Actions
// type CreateCodeInput = { url: string; parentGroupId: number; geo?: string; groupId: number };
// export const createCode: CreateCode<CreateCodeInput, Code> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Code.create({ data: { ...args, user: { connect: { id: context.user.id } } } });
// };

// type UpdateCodeData = { url?: string; parentGroupId?: number; geo?: string; groupId?: number };
// type UpdateCodeInput = { id: number; data: UpdateCodeData };
// export const updateCode: UpdateCode<UpdateCodeInput, Code> = async ({ id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Code.update({ where: { id }, data });
// };

// type DeleteCodeInput = { id: number };
// export const deleteCode: DeleteCode<DeleteCodeInput, Code> = async ({ id }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Code.delete({ where: { id } });
// };

// // Photo Actions
// type CreatePhotoInput = { url: string; type: PhotoType; entityType: EntityType; entityId: number; groupId?: number };
// export const createPhoto: CreatePhoto<CreatePhotoInput, Photo> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Photo.create({ data: { ...args, user: { connect: { id: context.user.id } } } });
// };

// type UpdatePhotoData = { url?: string; type?: PhotoType; entityType?: EntityType; entityId?: number; groupId?: number };
// type UpdatePhotoInput = { id: number; data: UpdatePhotoData };
// export const updatePhoto: UpdatePhoto<UpdatePhotoInput, Photo> = async ({ id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Photo.update({ where: { id }, data });
// };

// type DeletePhotoInput = { id: number };
// export const deletePhoto: DeletePhoto<DeletePhotoInput, Photo> = async ({ id }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Photo.delete({ where: { id } });
// };

// // Message Actions
// type CreateMessageInput = {
//   message: string;
//   recipientType: EntityType;
//   recipientId: number;
//   content: string;
//   entityType: EntityType;
//   entityId: number;
// };
// export const createMessage: CreateMessage<CreateMessageInput, Message> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Message.create({ data: { ...args, user: { connect: { id: context.user.id } } } });
// };

// type UpdateMessageData = {
//   message?: string;
//   recipientType?: EntityType;
//   recipientId?: number;
//   content?: string;
//   entityType?: EntityType;
//   entityId?: number;
// };
// type UpdateMessageInput = { id: number; data: UpdateMessageData };
// export const updateMessage: UpdateMessage<UpdateMessageInput, Message> = async ({ id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Message.update({ where: { id }, data });
// };

// type DeleteMessageInput = { id: number };
// export const deleteMessage: DeleteMessage<DeleteMessageInput, Message> = async ({ id }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Message.delete({ where: { id } });
// };

// // Greeting Actions
// type CreateGreetingInput = { message?: string | null, user2Id: number };
// export const createGreeting: CreateGreeting<CreateGreetingInput, Greeting> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Greeting.create({ data: { ...args, user1Id: context.user.id } });
// };

// type UpdateGreetingData = { message?: string | null };
// type UpdateGreetingInput = { user1Id: number; user2Id: number; data: UpdateGreetingData };
// export const updateGreeting: UpdateGreeting<UpdateGreetingInput, Greeting> = async ({ user1Id, user2Id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Greeting.update({ where: { user1Id_user2Id: { user1Id, user2Id } }, data });
// };

// type DeleteGreetingInput = { user1Id: number, user2Id: number };
// export const deleteGreeting: DeleteGreeting<DeleteGreetingInput, Greeting> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.Greeting.delete({ where: { user1Id_user2Id: args } });
// };

// // IceBreaker Actions
// type CreateIceBreakerInput = { question: string; groupId: number };
// export const createIceBreaker: CreateIceBreaker<CreateIceBreakerInput, IceBreaker> = async (args, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.IceBreaker.create({ data: { question: args.question, group: { connect: { id: args.groupId } } } });
// };

// type UpdateIceBreakerData = { question?: string; groupId?: number };
// type UpdateIceBreakerInput = { id: number; data: UpdateIceBreakerData };
// export const updateIceBreaker: UpdateIceBreaker<UpdateIceBreakerInput, IceBreaker> = async ({ id, data }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.IceBreaker.update({ where: { id }, data });
// };

// type DeleteIceBreakerInput = { id: number };
// export const deleteIceBreaker: DeleteIceBreaker<DeleteIceBreakerInput, IceBreaker> = async ({ id }, context) => {
//   if (!context.user) { throw new HttpError(401); }
//   return context.entities.IceBreaker.delete({ where: { id } });
// };
