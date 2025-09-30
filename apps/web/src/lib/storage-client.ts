// This file contains functions that are safe to run on the client.

// We re-export the server-side function. It's an async function, but
// because it doesn't actually await anything when returning a simple string
// path, we can safely use it in client components without issue.
export { getPublicUrl } from './storage'
