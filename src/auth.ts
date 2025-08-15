// src/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import { getCodeTable } from '@/lib/codes'
import type { Membership } from '@/types/next-auth'
import bcrypt from 'bcrypt'
import { authConfig } from './auth.config'

// This is the primary, server-side NextAuth configuration.
// It merges the Edge-safe config with server-only providers.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials

        if (!email || !password) return null

        const isEmail = (email as string).includes('@')

        const dbUser = await prisma.user.findUnique({
          where: isEmail
            ? { email: email as string }
            : { username: email as string },
          include: {
            groupMemberships: { include: { group: true, role: true } },
            photos: true, // We'll filter photos manually after getting code tables
          },
        })

        if (!dbUser || !dbUser.password) return null

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          dbUser.password,
        )

        if (!passwordsMatch) return null

        const isSuperAdmin = dbUser.groupMemberships.some(
          (mem) =>
            mem.group.slug === 'global-admin' && mem.role.code === 'super',
        )

        const memberships: Membership[] = dbUser.groupMemberships.map(
          (mem) => ({
            role: { code: mem.role.code },
            group: { slug: mem.group.slug },
            groupId: mem.groupId,
            userId: mem.userId,
          }),
        )

        const [photoTypes, entityTypes] = await Promise.all([
          getCodeTable('photoType'),
          getCodeTable('entityType'),
        ])

        const primaryPhoto = dbUser.photos.find(
          (p) =>
            p.typeId === photoTypes.primary.id &&
            p.entityTypeId === entityTypes.user.id &&
            p.entityId === dbUser.id,
        )

        const photoUrl = primaryPhoto?.url || null

        return {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          isSuperAdmin,
          memberships,
          image: photoUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, populate the token with user data
      if (user) {
        token.id = user.id
        token.firstName = user.firstName
        token.isSuperAdmin = user.isSuperAdmin
        token.memberships = user.memberships
        token.image = user.image
      }

      // When the session is updated (e.g., profile name or picture change),
      // we can update the token directly with the data passed in the session object.
      if (trigger === 'update' && session) {
        if (session.name) {
          token.name = session.name
          token.firstName = session.name // Also update our custom firstName property
        }
        // Only update the image in the token if a new image URL is provided.
        // A `null` value for `session.image` means no new photo was uploaded.
        if (session.image) {
          token.image = session.image
        }
      }

      return token
    },
    async session({ session, token }) {
      // Here we are passing the data from the token to the client-side session object.
      if (session.user) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
        session.user.memberships = token.memberships as Membership[]
        session.user.image = token.image as string | null
      }
      return session
    },
  },
})
