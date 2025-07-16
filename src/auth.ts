import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';

import prisma, { prismaWithCaching } from '@/lib/prisma';
import { authConfig } from './auth.config';
import type { Role } from './types/next-auth';
import { PhotoType, EntityType } from './generated/prisma';
import { getPublicUrl } from '@/lib/storage';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
        async jwt({ token, user, trigger, session }) {
      // Initial sign-in: Augment the token with custom data.
      if (user) {
        token.id = user.id ?? '';
        token.name = user.name;
        token.roles = user.roles;
        token.firstName = user.firstName;
        token.picture = user.image;
      }

      // Handle session updates, e.g., when a user updates their profile.
      if (trigger === 'update') {
        // Refetch the user from the database to get the most up-to-date info.
        // This is the most reliable way to ensure the token is fresh.
        const fullUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            photos: {
              where: {
                type: PhotoType.primary,
                entityType: EntityType.user,
              },
              select: { url: true },
              take: 1,
            },
          },
        });

        if (fullUser) {
          // Update the name and firstName on the token.
          token.firstName = fullUser.firstName;
          token.name = `${fullUser.firstName} ${fullUser.lastName || ''}`.trim();

          // If the client passed a new image URL, use it for instant UI feedback.
          // Otherwise, use the URL from the database.
          if (typeof session?.user?.image !== 'undefined') {
            token.picture = session.user.image;
          } else {
            const rawUrl = fullUser.photos[0]?.url;
            if (rawUrl) {
              token.picture = rawUrl.startsWith('http')
                ? rawUrl
                : await getPublicUrl(rawUrl);
            } else {
              // Fallback to a default if no photo exists.
              token.picture = null;
            }
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.roles = token.roles as Role[];
        session.user.firstName = token.firstName as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
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

        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: String(credentials.username),
              mode: 'insensitive',
            },
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
            photos: {
              where: {
                type: PhotoType.primary,
                entityType: EntityType.user,
              },
              select: {
                url: true,
              },
              take: 1,
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

        const rawUrl = user.photos[0]?.url;
        let primaryPhotoUrl: string | null = null;
        if (rawUrl) {
          if (rawUrl.startsWith('http')) {
            primaryPhotoUrl = rawUrl;
          } else {
            primaryPhotoUrl = await getPublicUrl(rawUrl);
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName || ''}`.trim(),
          firstName: user.firstName,
          roles: userRoles,
          image: primaryPhotoUrl,
        };
      },
    }),
  ],
});


