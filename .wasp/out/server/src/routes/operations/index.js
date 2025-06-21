import express from 'express'

import auth from 'wasp/core/auth'

import getUser from './getUser.js'
import getUsers from './getUsers.js'
import getGroup from './getGroup.js'
import getGroups from './getGroups.js'
import getLink from './getLink.js'
import getLinks from './getLinks.js'
import getCode from './getCode.js'
import getCodes from './getCodes.js'
import getPhoto from './getPhoto.js'
import getPhotos from './getPhotos.js'
import getMessage from './getMessage.js'
import getMessages from './getMessages.js'
import getGreeting from './getGreeting.js'
import getGreetings from './getGreetings.js'
import getIceBreaker from './getIceBreaker.js'
import getIceBreakers from './getIceBreakers.js'

const router = express.Router()

router.post('/get-user', auth, getUser)
router.post('/get-users', auth, getUsers)
router.post('/get-group', auth, getGroup)
router.post('/get-groups', auth, getGroups)
router.post('/get-link', auth, getLink)
router.post('/get-links', auth, getLinks)
router.post('/get-code', auth, getCode)
router.post('/get-codes', auth, getCodes)
router.post('/get-photo', auth, getPhoto)
router.post('/get-photos', auth, getPhotos)
router.post('/get-message', auth, getMessage)
router.post('/get-messages', auth, getMessages)
router.post('/get-greeting', auth, getGreeting)
router.post('/get-greetings', auth, getGreetings)
router.post('/get-ice-breaker', auth, getIceBreaker)
router.post('/get-ice-breakers', auth, getIceBreakers)

export default router
