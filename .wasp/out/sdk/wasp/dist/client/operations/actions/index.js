import { createAction } from './core';
// PUBLIC API
export const updateUser = createAction('operations/update-user', ['User']);
// PUBLIC API
export const deleteUser = createAction('operations/delete-user', ['User']);
// PUBLIC API
export const createGroup = createAction('operations/create-group', ['Group', 'GroupUser']);
// PUBLIC API
export const updateGroup = createAction('operations/update-group', ['Group', 'GroupUser']);
// PUBLIC API
export const deleteGroup = createAction('operations/delete-group', ['Group', 'GroupUser']);
// PUBLIC API
export const createPhoto = createAction('operations/create-photo', ['Photo', 'User', 'Group', 'GroupUser']);
// PUBLIC API
export const updatePhoto = createAction('operations/update-photo', ['Photo', 'User', 'Group', 'GroupUser']);
// PUBLIC API
export const deletePhoto = createAction('operations/delete-photo', ['Photo', 'User', 'Group', 'GroupUser']);
// PUBLIC API
export const createMessage = createAction('operations/create-message', ['Message']);
// PUBLIC API
export const updateMessage = createAction('operations/update-message', ['Message']);
// PUBLIC API
export const deleteMessage = createAction('operations/delete-message', ['Message']);
// PUBLIC API
export const createUserUser = createAction('operations/create-user-user', ['UserUser', 'GroupUser']);
// PUBLIC API
export const updateUserUser = createAction('operations/update-user-user', ['UserUser', 'GroupUser']);
// PUBLIC API
export const deleteUserUser = createAction('operations/delete-user-user', ['UserUser', 'GroupUser']);
// PUBLIC API
export const joinGroup = createAction('operations/join-group', ['GroupUser', 'Code', 'Group']);
// PUBLIC API
export const leaveGroup = createAction('operations/leave-group', ['GroupUser']);
// PUBLIC API
export const updateUserRole = createAction('operations/update-user-role', ['GroupUser']);
// PUBLIC API
export const createCode = createAction('operations/create-code', ['Code', 'User', 'Group', 'GroupUser']);
// PUBLIC API
export const updateCode = createAction('operations/update-code', ['Code', 'User', 'Group', 'GroupUser']);
// PUBLIC API
export const deleteCode = createAction('operations/delete-code', ['Code', 'User', 'Group', 'GroupUser']);
// PUBLIC API
export const createGreeting = createAction('operations/create-greeting', ['Greeting', 'UserUser']);
// PUBLIC API
export const updateGreeting = createAction('operations/update-greeting', ['Greeting', 'UserUser']);
// PUBLIC API
export const deleteGreeting = createAction('operations/delete-greeting', ['Greeting', 'UserUser']);
// PUBLIC API
export const createLink = createAction('operations/create-link', ['Link', 'Group', 'GroupUser']);
// PUBLIC API
export const updateLink = createAction('operations/update-link', ['Link', 'Group', 'GroupUser']);
// PUBLIC API
export const deleteLink = createAction('operations/delete-link', ['Link', 'Group', 'GroupUser']);
// PUBLIC API
export const createIceBreaker = createAction('operations/create-ice-breaker', ['IceBreaker', 'GroupUser']);
// PUBLIC API
export const updateIceBreaker = createAction('operations/update-ice-breaker', ['IceBreaker', 'GroupUser']);
// PUBLIC API
export const deleteIceBreaker = createAction('operations/delete-ice-breaker', ['IceBreaker', 'GroupUser']);
//# sourceMappingURL=index.js.map