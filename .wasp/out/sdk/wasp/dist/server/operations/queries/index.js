import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { getUser as getUser_ext } from 'wasp/src/queries';
import { getUsers as getUsers_ext } from 'wasp/src/queries';
import { getGroup as getGroup_ext } from 'wasp/src/queries';
import { getGroups as getGroups_ext } from 'wasp/src/queries';
import { getLink as getLink_ext } from 'wasp/src/queries';
import { getLinks as getLinks_ext } from 'wasp/src/queries';
import { getCode as getCode_ext } from 'wasp/src/queries';
import { getCodes as getCodes_ext } from 'wasp/src/queries';
import { getPhoto as getPhoto_ext } from 'wasp/src/queries';
import { getPhotos as getPhotos_ext } from 'wasp/src/queries';
import { getMessage as getMessage_ext } from 'wasp/src/queries';
import { getMessages as getMessages_ext } from 'wasp/src/queries';
import { getGreeting as getGreeting_ext } from 'wasp/src/queries';
import { getGreetings as getGreetings_ext } from 'wasp/src/queries';
import { getIceBreaker as getIceBreaker_ext } from 'wasp/src/queries';
import { getIceBreakers as getIceBreakers_ext } from 'wasp/src/queries';
// PUBLIC API
export const getUser = createAuthenticatedOperation(getUser_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getUsers = createAuthenticatedOperation(getUsers_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getGroup = createAuthenticatedOperation(getGroup_ext, {
    Group: prisma.group,
});
// PUBLIC API
export const getGroups = createAuthenticatedOperation(getGroups_ext, {
    Group: prisma.group,
});
// PUBLIC API
export const getLink = createAuthenticatedOperation(getLink_ext, {
    Link: prisma.link,
    Group: prisma.group,
});
// PUBLIC API
export const getLinks = createAuthenticatedOperation(getLinks_ext, {
    Link: prisma.link,
    Group: prisma.group,
});
// PUBLIC API
export const getCode = createAuthenticatedOperation(getCode_ext, {
    Code: prisma.code,
    User: prisma.user,
    Group: prisma.group,
});
// PUBLIC API
export const getCodes = createAuthenticatedOperation(getCodes_ext, {
    Code: prisma.code,
    User: prisma.user,
    Group: prisma.group,
});
// PUBLIC API
export const getPhoto = createAuthenticatedOperation(getPhoto_ext, {
    Photo: prisma.photo,
    User: prisma.user,
    Group: prisma.group,
});
// PUBLIC API
export const getPhotos = createAuthenticatedOperation(getPhotos_ext, {
    Photo: prisma.photo,
    User: prisma.user,
    Group: prisma.group,
});
// PUBLIC API
export const getMessage = createAuthenticatedOperation(getMessage_ext, {
    Message: prisma.message,
    User: prisma.user,
});
// PUBLIC API
export const getMessages = createAuthenticatedOperation(getMessages_ext, {
    Message: prisma.message,
    User: prisma.user,
});
// PUBLIC API
export const getGreeting = createAuthenticatedOperation(getGreeting_ext, {
    Greeting: prisma.greeting,
    User: prisma.user,
});
// PUBLIC API
export const getGreetings = createAuthenticatedOperation(getGreetings_ext, {
    Greeting: prisma.greeting,
    User: prisma.user,
});
// PUBLIC API
export const getIceBreaker = createAuthenticatedOperation(getIceBreaker_ext, {
    IceBreaker: prisma.iceBreaker,
    Group: prisma.group,
});
// PUBLIC API
export const getIceBreakers = createAuthenticatedOperation(getIceBreakers_ext, {
    IceBreaker: prisma.iceBreaker,
    Group: prisma.group,
});
//# sourceMappingURL=index.js.map