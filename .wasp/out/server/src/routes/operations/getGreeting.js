import { createQuery } from '../../middleware/operations.js'
import getGreeting from '../../queries/getGreeting.js'

export default createQuery(getGreeting)
