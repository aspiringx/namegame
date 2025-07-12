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
      // Initial sign-in
      if (user) {
        token.id = user.id ?? '';
        token.roles = user.roles;
        token.picture = user.image; // This comes from the authorize callback
      }

      // This trigger is fired when the user updates their profile, or when the
      // client calls the `update` function.
      if (trigger === 'update' && session?.user) {
        // The client can pass the new image URL directly. If it does, we use it.
        // This is the most reliable way to ensure the UI updates instantly.
        if (typeof session.user.image !== 'undefined') {
          token.picture = session.user.image;
        } else {
          // As a fallback, refetch the user from the database.
          const fullUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
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

          if (fullUser) {
            const photoUrl = fullUser.photos[0]?.url
              ? await getPublicUrl(fullUser.photos[0].url)
              : null;
            token.picture = photoUrl;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as Role[];
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

        const user = await prisma.user.findUnique({
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

        const primaryPhotoUrl = user.photos[0]?.url
          ? await getPublicUrl(user.photos[0].url)
          : null;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          roles: userRoles,
          image: primaryPhotoUrl,
        };
      },
    }),
  ],
});


