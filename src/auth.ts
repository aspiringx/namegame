// src/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { getPublicUrl } from '@/lib/storage';
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
        console.log('--- Authorize Function Start ---');
        console.log('Received credentials:', {
          username: credentials?.username,
          password: credentials?.password ? '[REDACTED]' : undefined,
        });

        if (!credentials?.username || !credentials.password) {
          console.log('Authorize failed: Username or password missing.');
          return null;
        }

        console.log(`Searching for user with username: ${credentials.username}`);
        const dbUser = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: {
            groupMemberships: { include: { group: true, role: true } },
            photos: { where: { type: { code: 'profile' } }, take: 1 },
          },
        });

        if (!dbUser || !dbUser.password) {
          console.log('Authorize failed: User not found or password not set.');
          return null;
        }
        console.log('Database user found:', { id: dbUser.id, username: dbUser.username });

        console.log('Comparing passwords...');
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          dbUser.password
        );

        if (!passwordsMatch) {
          console.log('Authorize failed: Passwords do not match.');
          return null;
        }
        console.log('Passwords match successfully.');

        const isSuperAdmin = dbUser.groupMemberships.some(
          (mem) => mem.group.slug === 'global-admin' && mem.role.code === 'super'
        );

        const memberships: Membership[] = dbUser.groupMemberships.map((mem) => ({
          role: { code: mem.role.code },
          group: { slug: mem.group.slug },
          groupId: mem.groupId,
          userId: mem.userId,
        }));

        let photoUrl = null;
        if (dbUser.photos && dbUser.photos[0]?.url) {
          photoUrl = await getPublicUrl(dbUser.photos[0].url);
        }

        const userPayload = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          isSuperAdmin,
          memberships,
          image: photoUrl,
        };

        console.log('Authentication successful. Returning user object:', {
          id: userPayload.id,
          email: userPayload.email,
        });
        return userPayload;
      },
    }),
  ],
});