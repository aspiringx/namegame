import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';

import { prisma as db } from '@/lib/prisma';
import { authConfig } from './auth.config';
import type { Role } from './types/next-auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            username: String(credentials.username),
          },
          include: {
            groupMemberships: {
              include: {
                group: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          String(credentials.password),
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        const userRoles: Role[] = user.groupMemberships.map((mem) => ({
          groupId: mem.groupId,
          role: mem.role,
          groupSlug: mem.group.slug,
        }));

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          roles: userRoles,
        };
      },
    }),
  ],
});


