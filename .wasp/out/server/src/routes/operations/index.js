import express from 'express'

import auth from 'wasp/core/auth'

import updateUser from './updateUser.js'
import deleteUser from './deleteUser.js'
import createGroup from './createGroup.js'
import updateGroup from './updateGroup.js'
import deleteGroup from './deleteGroup.js'
import createPhoto from './createPhoto.js'
import updatePhoto from './updatePhoto.js'
import deletePhoto from './deletePhoto.js'
import createMessage from './createMessage.js'
import updateMessage from './updateMessage.js'
import deleteMessage from './deleteMessage.js'
import createUserUser from './createUserUser.js'
import updateUserUser from './updateUserUser.js'
import deleteUserUser from './deleteUserUser.js'
import joinGroup from './joinGroup.js'
import leaveGroup from './leaveGroup.js'
import updateUserRole from './updateUserRole.js'
import createCode from './createCode.js'
import updateCode from './updateCode.js'
import deleteCode from './deleteCode.js'
import createGreeting from './createGreeting.js'
import updateGreeting from './updateGreeting.js'
import deleteGreeting from './deleteGreeting.js'
import createLink from './createLink.js'
import updateLink from './updateLink.js'
import deleteLink from './deleteLink.js'
import createIceBreaker from './createIceBreaker.js'
import updateIceBreaker from './updateIceBreaker.js'
import deleteIceBreaker from './deleteIceBreaker.js'
import getUser from './getUser.js'
import getUsers from './getUsers.js'
import getGroup from './getGroup.js'
import getGroups from './getGroups.js'
import getPhoto from './getPhoto.js'
import getPhotos from './getPhotos.js'
import getMessage from './getMessage.js'
import getMessages from './getMessages.js'
import getCode from './getCode.js'
import getCodes from './getCodes.js'
import getGreeting from './getGreeting.js'
import getGreetings from './getGreetings.js'
import getLink from './getLink.js'
import getLinks from './getLinks.js'
import getIceBreaker from './getIceBreaker.js'
import getIceBreakers from './getIceBreakers.js'

const router = express.Router()

router.post('/update-user', auth, updateUser)
router.post('/delete-user', auth, deleteUser)
router.post('/create-group', auth, createGroup)
router.post('/update-group', auth, updateGroup)
router.post('/delete-group', auth, deleteGroup)
router.post('/create-photo', auth, createPhoto)
router.post('/update-photo', auth, updatePhoto)
router.post('/delete-photo', auth, deletePhoto)
router.post('/create-message', auth, createMessage)
router.post('/update-message', auth, updateMessage)
router.post('/delete-message', auth, deleteMessage)
router.post('/create-user-user', auth, createUserUser)
router.post('/update-user-user', auth, updateUserUser)
router.post('/delete-user-user', auth, deleteUserUser)
router.post('/join-group', auth, joinGroup)
router.post('/leave-group', auth, leaveGroup)
router.post('/update-user-role', auth, updateUserRole)
router.post('/create-code', auth, createCode)
router.post('/update-code', auth, updateCode)
router.post('/delete-code', auth, deleteCode)
router.post('/create-greeting', auth, createGreeting)
router.post('/update-greeting', auth, updateGreeting)
router.post('/delete-greeting', auth, deleteGreeting)
router.post('/create-link', auth, createLink)
router.post('/update-link', auth, updateLink)
router.post('/delete-link', auth, deleteLink)
router.post('/create-ice-breaker', auth, createIceBreaker)
router.post('/update-ice-breaker', auth, updateIceBreaker)
router.post('/delete-ice-breaker', auth, deleteIceBreaker)
router.post('/get-user', auth, getUser)
router.post('/get-users', auth, getUsers)
router.post('/get-group', auth, getGroup)
router.post('/get-groups', auth, getGroups)
router.post('/get-photo', auth, getPhoto)
router.post('/get-photos', auth, getPhotos)
router.post('/get-message', auth, getMessage)
router.post('/get-messages', auth, getMessages)
router.post('/get-code', auth, getCode)
router.post('/get-codes', auth, getCodes)
router.post('/get-greeting', auth, getGreeting)
router.post('/get-greetings', auth, getGreetings)
router.post('/get-link', auth, getLink)
router.post('/get-links', auth, getLinks)
router.post('/get-ice-breaker', auth, getIceBreaker)
router.post('/get-ice-breakers', auth, getIceBreakers)

export default router
