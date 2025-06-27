import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { updateUser as updateUser_ext } from 'wasp/src/actions';
import { deleteUser as deleteUser_ext } from 'wasp/src/actions';
import { createGroup as createGroup_ext } from 'wasp/src/actions';
import { updateGroup as updateGroup_ext } from 'wasp/src/actions';
import { deleteGroup as deleteGroup_ext } from 'wasp/src/actions';
import { createPhoto as createPhoto_ext } from 'wasp/src/actions';
import { updatePhoto as updatePhoto_ext } from 'wasp/src/actions';
import { deletePhoto as deletePhoto_ext } from 'wasp/src/actions';
import { createMessage as createMessage_ext } from 'wasp/src/actions';
import { updateMessage as updateMessage_ext } from 'wasp/src/actions';
import { deleteMessage as deleteMessage_ext } from 'wasp/src/actions';
import { createUserUser as createUserUser_ext } from 'wasp/src/actions';
import { updateUserUser as updateUserUser_ext } from 'wasp/src/actions';
import { deleteUserUser as deleteUserUser_ext } from 'wasp/src/actions';
import { joinGroup as joinGroup_ext } from 'wasp/src/actions';
import { leaveGroup as leaveGroup_ext } from 'wasp/src/actions';
import { updateUserRole as updateUserRole_ext } from 'wasp/src/actions';
import { createCode as createCode_ext } from 'wasp/src/actions';
import { updateCode as updateCode_ext } from 'wasp/src/actions';
import { deleteCode as deleteCode_ext } from 'wasp/src/actions';
import { createGreeting as createGreeting_ext } from 'wasp/src/actions';
import { updateGreeting as updateGreeting_ext } from 'wasp/src/actions';
import { deleteGreeting as deleteGreeting_ext } from 'wasp/src/actions';
import { createLink as createLink_ext } from 'wasp/src/actions';
import { updateLink as updateLink_ext } from 'wasp/src/actions';
import { deleteLink as deleteLink_ext } from 'wasp/src/actions';
import { createIceBreaker as createIceBreaker_ext } from 'wasp/src/actions';
import { updateIceBreaker as updateIceBreaker_ext } from 'wasp/src/actions';
import { deleteIceBreaker as deleteIceBreaker_ext } from 'wasp/src/actions';
// PUBLIC API
export const updateUser = createAuthenticatedOperation(updateUser_ext, {
    User: prisma.user,
});
// PUBLIC API
export const deleteUser = createAuthenticatedOperation(deleteUser_ext, {
    User: prisma.user,
});
// PUBLIC API
export const createGroup = createAuthenticatedOperation(createGroup_ext, {
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const updateGroup = createAuthenticatedOperation(updateGroup_ext, {
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const deleteGroup = createAuthenticatedOperation(deleteGroup_ext, {
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const createPhoto = createAuthenticatedOperation(createPhoto_ext, {
    Photo: prisma.photo,
    User: prisma.user,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const updatePhoto = createAuthenticatedOperation(updatePhoto_ext, {
    Photo: prisma.photo,
    User: prisma.user,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const deletePhoto = createAuthenticatedOperation(deletePhoto_ext, {
    Photo: prisma.photo,
    User: prisma.user,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const createMessage = createAuthenticatedOperation(createMessage_ext, {
    Message: prisma.message,
});
// PUBLIC API
export const updateMessage = createAuthenticatedOperation(updateMessage_ext, {
    Message: prisma.message,
});
// PUBLIC API
export const deleteMessage = createAuthenticatedOperation(deleteMessage_ext, {
    Message: prisma.message,
});
// PUBLIC API
export const createUserUser = createAuthenticatedOperation(createUserUser_ext, {
    UserUser: prisma.userUser,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const updateUserUser = createAuthenticatedOperation(updateUserUser_ext, {
    UserUser: prisma.userUser,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const deleteUserUser = createAuthenticatedOperation(deleteUserUser_ext, {
    UserUser: prisma.userUser,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const joinGroup = createAuthenticatedOperation(joinGroup_ext, {
    GroupUser: prisma.groupUser,
    Code: prisma.code,
    Group: prisma.group,
});
// PUBLIC API
export const leaveGroup = createAuthenticatedOperation(leaveGroup_ext, {
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const updateUserRole = createAuthenticatedOperation(updateUserRole_ext, {
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const createCode = createAuthenticatedOperation(createCode_ext, {
    Code: prisma.code,
    User: prisma.user,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const updateCode = createAuthenticatedOperation(updateCode_ext, {
    Code: prisma.code,
    User: prisma.user,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const deleteCode = createAuthenticatedOperation(deleteCode_ext, {
    Code: prisma.code,
    User: prisma.user,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const createGreeting = createAuthenticatedOperation(createGreeting_ext, {
    Greeting: prisma.greeting,
    UserUser: prisma.userUser,
});
// PUBLIC API
export const updateGreeting = createAuthenticatedOperation(updateGreeting_ext, {
    Greeting: prisma.greeting,
    UserUser: prisma.userUser,
});
// PUBLIC API
export const deleteGreeting = createAuthenticatedOperation(deleteGreeting_ext, {
    Greeting: prisma.greeting,
    UserUser: prisma.userUser,
});
// PUBLIC API
export const createLink = createAuthenticatedOperation(createLink_ext, {
    Link: prisma.link,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const updateLink = createAuthenticatedOperation(updateLink_ext, {
    Link: prisma.link,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const deleteLink = createAuthenticatedOperation(deleteLink_ext, {
    Link: prisma.link,
    Group: prisma.group,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const createIceBreaker = createAuthenticatedOperation(createIceBreaker_ext, {
    IceBreaker: prisma.iceBreaker,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const updateIceBreaker = createAuthenticatedOperation(updateIceBreaker_ext, {
    IceBreaker: prisma.iceBreaker,
    GroupUser: prisma.groupUser,
});
// PUBLIC API
export const deleteIceBreaker = createAuthenticatedOperation(deleteIceBreaker_ext, {
    IceBreaker: prisma.iceBreaker,
    GroupUser: prisma.groupUser,
});
//# sourceMappingURL=index.js.map