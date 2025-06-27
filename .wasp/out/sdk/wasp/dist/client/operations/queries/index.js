import { createQuery } from './core';
// PUBLIC API
export const getUser = createQuery('operations/get-user', ['User']);
// PUBLIC API
export const getUsers = createQuery('operations/get-users', ['User']);
// PUBLIC API
export const getGroup = createQuery('operations/get-group', ['Group', 'User', 'GroupUser', 'Photo', 'Message', 'Link', 'IceBreaker']);
// PUBLIC API
export const getGroups = createQuery('operations/get-groups', ['Group']);
// PUBLIC API
export const getPhoto = createQuery('operations/get-photo', ['Photo', 'User', 'Group']);
// PUBLIC API
export const getPhotos = createQuery('operations/get-photos', ['Photo', 'User', 'Group']);
// PUBLIC API
export const getMessage = createQuery('operations/get-message', ['Message', 'User', 'Group']);
// PUBLIC API
export const getMessages = createQuery('operations/get-messages', ['Message', 'User', 'Group']);
// PUBLIC API
export const getCode = createQuery('operations/get-code', ['Code', 'User', 'Group']);
// PUBLIC API
export const getCodes = createQuery('operations/get-codes', ['Code', 'User', 'Group']);
// PUBLIC API
export const getGreeting = createQuery('operations/get-greeting', ['Greeting', 'UserUser']);
// PUBLIC API
export const getGreetings = createQuery('operations/get-greetings', ['Greeting', 'UserUser']);
// PUBLIC API
export const getLink = createQuery('operations/get-link', ['Link', 'Group']);
// PUBLIC API
export const getLinks = createQuery('operations/get-links', ['Link', 'Group']);
// PUBLIC API
export const getIceBreaker = createQuery('operations/get-ice-breaker', ['IceBreaker', 'User', 'Group']);
// PUBLIC API
export const getIceBreakers = createQuery('operations/get-ice-breakers', ['IceBreaker', 'User', 'Group']);
// PRIVATE API (used in SDK)
export { buildAndRegisterQuery } from './core';
//# sourceMappingURL=index.js.map