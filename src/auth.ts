// src/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { getPublicUrl } from '@/lib/storage';
import type { Membership } from '@/types/next-auth';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

// This is the primary, server-side NextAuth configuration.
// It merges the Edge-safe config with server-only providers.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const dbUser = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            groupMemberships: { include: { group: true, role: true } },
            photos: { where: { type: { code: 'profile' } }, take: 1 },
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

        const photoUrl = dbUser.photos[0]?.url
          ? await getPublicUrl(dbUser.photos[0].url)
          : null;

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
});