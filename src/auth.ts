// src/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { getCodeTable } from '@/lib/codes';
import type { Membership } from '@/types/next-auth';
import bcrypt from 'bcrypt';
import { authConfig } from './auth.config';

// This is the primary, server-side NextAuth configuration.
// It merges the Edge-safe config with server-only providers.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null;

        const dbUser = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: {
            groupMemberships: { include: { group: true, role: true } },
            photos: true, // We'll filter photos manually after getting code tables
          },
        });

        if (!dbUser || !dbUser.password) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          dbUser.password
        );

        if (!passwordsMatch) return null;

        const isSuperAdmin = dbUser.groupMemberships.some(
          (mem) => mem.group.slug === 'global-admin' && mem.role.code === 'super'
        );

        const memberships: Membership[] = dbUser.groupMemberships.map((mem) => ({
          role: { code: mem.role.code },
          group: { slug: mem.group.slug },
          groupId: mem.groupId,
          userId: mem.userId,
        }));

        const [photoTypes, entityTypes] = await Promise.all([
          getCodeTable('photoType'),
          getCodeTable('entityType'),
        ]);

        const primaryPhoto = dbUser.photos.find(
          (p) => p.typeId === photoTypes.primary.id && p.entityTypeId === entityTypes.user.id
        );

        const photoUrl = primaryPhoto?.url || null;

        return {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          isSuperAdmin,
          memberships,
          image: photoUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // The `trigger === 'update'` block is used to handle session updates.
      // This is essential for reflecting changes made on the client (e.g., updating a profile picture)
      // in the session token without requiring the user to log out and back in.
      if (trigger === 'update' && session) {
        // When the session is updated, the `session` object contains the updated data.
        // We need to update the token with this new data.
        if (session.name) {
          token.firstName = session.name;
        }
        if (session.image) {
          token.image = session.image;
        }
      }

      // The `if (user)` block is only triggered on initial sign-in.
      // It populates the token with the user's data from the database.
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.isSuperAdmin = user.isSuperAdmin;
        token.memberships = user.memberships;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Here we are passing the data from the token to the client-side session object.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.memberships = token.memberships as Membership[];
        session.user.image = token.image as string | null;
      }
      return session;
    },
  },
});