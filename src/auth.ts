// src/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { addDays, isBefore } from 'date-fns';
import prisma from '@/lib/prisma';
import { getCodeTable } from '@/lib/codes'
import type { Membership } from '@/types/next-auth'
import bcrypt from 'bcrypt'
import { authConfig } from './auth.config'

// This is the primary, server-side NextAuth configuration.
// It merges the Edge-safe config with server-only providers.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    maxAge: 90 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      id: 'credentials',
      async authorize(credentials) {
        const { email, password } = credentials

        if (!email || !password) return null

        const lowercasedIdentifier = (email as string).toLowerCase()
        const isEmail = lowercasedIdentifier.includes('@')

        const dbUser = await prisma.user.findFirst({
          where: isEmail
            ? { email: { equals: lowercasedIdentifier, mode: 'insensitive' } }
            : {
                username: { equals: lowercasedIdentifier, mode: 'insensitive' },
              },
          include: {
            groupMemberships: { include: { group: true, role: true } },
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

        const primaryPhoto = await prisma.photo.findFirst({
          where: {
            entityId: dbUser.id,
            entityTypeId: entityTypes.user.id,
            typeId: photoTypes.primary.id,
          },
        })

        const photoUrl = primaryPhoto?.url || null

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
    Credentials({
      id: 'one-time-code',
      async authorize(credentials) {
        const { code } = credentials;
        if (!code) return null;

        const loginCode = await prisma.code.findUnique({
          where: { code: code as string },
        });

        if (!loginCode) return null;

        const expiresAt = addDays(loginCode.createdAt, 7);
        if (isBefore(expiresAt, new Date())) {
          await prisma.code.delete({ where: { code: code as string } });
          return null;
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: loginCode.userId },
          include: {
            groupMemberships: { include: { group: true, role: true } },
          },
        });

        if (!dbUser) return null;

        await prisma.code.delete({ where: { code: code as string } });

        const isSuperAdmin = dbUser.groupMemberships.some(
          (mem) =>
            mem.group.slug === 'global-admin' && mem.role.code === 'super',
        );

        const memberships: Membership[] = dbUser.groupMemberships.map(
          (mem) => ({
            role: { code: mem.role.code },
            group: { slug: mem.group.slug },
            groupId: mem.groupId,
            userId: mem.userId,
          }),
        );

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
        });

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
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.isSuperAdmin = user.isSuperAdmin;
        token.memberships = user.memberships;
        token.image = user.image;
      }

      if (trigger === 'update' && session) {
        if (session.name) {
          token.name = session.name;
          token.firstName = session.name;
        }
        if (session.image) {
          token.image = session.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
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
