'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * Determines the appropriate redirect path for a user after login.
 * @returns A URL string for redirection.
 */
export async function getLoginRedirectPath(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    // Should not happen if called right after a successful login,
    // but as a fallback, send to the homepage.
    return '/';
  }

  const groupMemberships = await prisma.groupUser.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        select: { slug: true },
      },
    },
  });

  if (groupMemberships.length === 1) {
    // If user is in exactly one group, redirect to that group's page.
    return `/g/${groupMemberships[0].group.slug}`;
  } else if (groupMemberships.length > 1) {
    // If in multiple groups, redirect to the user page with a welcome message flag.
    return '/user?welcome=true';
  } else {
    // If in zero groups or any other case, redirect to the user page.
    return '/user';
  }
}
