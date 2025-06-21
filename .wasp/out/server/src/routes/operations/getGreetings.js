import { createQuery } from '../../middleware/operations.js'
import getGreetings from '../../queries/getGreetings.js'

export default createQuery(getGreetings)
