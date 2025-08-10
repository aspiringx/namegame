// src/app/api/auth/[...auth]/route.ts

import { handlers } from '@/auth'

// The handlers object contains the GET and POST methods for the NextAuth.js API routes.
// We are destructuring them and exporting them here, which is the standard pattern.
export const { GET, POST } = handlers
