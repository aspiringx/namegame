import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';

import prisma, { prismaWithCaching } from '@/lib/prisma';
import { getCodeTable } from './lib/codes';
import { getPublicUrl } from '@/lib/storage';


import { authConfig } from './auth.config';

import { NEXTAUTH_SECRET } from './auth.secret';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  secret: NEXTAUTH_SECRET,
  callbacks: {

    async jwt({ token }) {
      if (!token.sub) return token;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          groupMemberships: {
            include: {
              group: true,
              role: true,
            },
          },
        },
      });

      if (!dbUser) return token;

      const [photoTypes, entityTypes] = await Promise.all([
        getCodeTable('photoType'),
        getCodeTable('entityType'),
      ]);

      const primaryPhoto = await prisma.photo.findFirst({
        where: {
          entityId: dbUser.id,
          entityTypeId: entityTypes.user.id,
          typeId: photoTypes.primary.id,
        },
        select: { url: true },
      });

      const rawPhotoUrl = primaryPhoto?.url || null;
      const isSuperAdmin = dbUser.groupMemberships.some(
        (mem) => mem.group.slug === 'global-admin' && mem.role.code === 'super'
      );

      // Update token with data that is safe for the Edge runtime.
      token.id = dbUser.id;
      token.name = `${dbUser.firstName} ${dbUser.lastName || ''}`.trim();
      token.firstName = dbUser.firstName;
      token.picture = rawPhotoUrl; // Pass the raw URL, not the public one.
      token.memberships = dbUser.groupMemberships;
      token.isSuperAdmin = isSuperAdmin;

      return token;
    },
    async session({ session, token }) {
      // --- START DEBUG LOGS ---
      console.log('[AUTH_DEBUG] Token received in session callback:', JSON.stringify(token, null, 2));
      // --- END DEBUG LOGS ---

      if (token) {
        // The session callback runs in the Node.js environment, so we can use Node APIs here.
        const publicPhotoUrl = token.picture
          ? await getPublicUrl(token.picture as string)
          : null;

        session.isSuperAdmin = token.isSuperAdmin;
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.firstName = token.firstName as string;
        session.user.image = publicPhotoUrl;
        session.user.memberships = token.memberships;
        session.user.isSuperAdmin = token.isSuperAdmin;
      }

      // --- START DEBUG LOGS ---
      console.log('[AUTH_DEBUG] Session object being returned:', JSON.stringify(session, null, 2));
      // --- END DEBUG LOGS ---

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

        const [photoTypes, entityTypes] = await Promise.all([
          getCodeTable('photoType'),
          getCodeTable('entityType'),
        ]);

        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: credentials.username as string,
              mode: 'insensitive',
            },
          },
          include: {
            groupMemberships: {
              include: {
                role: { select: { code: true } },
                group: { select: { slug: true } },
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (passwordsMatch) {
          const primaryPhoto = await prisma.photo.findFirst({
            where: {
              entityId: user.id,
              entityTypeId: entityTypes.user.id,
              typeId: photoTypes.primary.id,
            },
            select: { url: true },
          });

          const photoUrl = primaryPhoto?.url
            ? await getPublicUrl(primaryPhoto.url)
            : null;

          const isSuperAdmin = user.groupMemberships.some(
            (mem) => mem.group.slug === 'global-admin' && mem.role.code === 'super'
          );

          return {
            ...user,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            image: photoUrl,
            memberships: user.groupMemberships,
            isSuperAdmin,
          };
        }

        return null;
      },
    }),
  ],
});
