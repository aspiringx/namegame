'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { EntityType, PhotoType, GroupUserRole } from '@/generated/prisma';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage';
import { auth } from '@/auth';

// Define the schema for form validation using Zod
const GroupSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.instanceof(File).optional(),
});

export async function updateGroup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to update a group.');
  }
  const userId = session.user.id;
  // Extract and validate data
  const validatedFields = GroupSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    logo: formData.get('logo'),
  });

  if (!validatedFields.success) {
    // Handle validation errors
    console.error(validatedFields.error);
    throw new Error('Invalid form data.');
  }

  const { logo, ...groupData } = validatedFields.data;

  try {
      const groupId = Number(formData.get('groupId'));

  const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { 
        ...groupData, 
        updatedBy: { connect: { id: userId } } 
      },
    });

    if (logo && logo.size > 0) {
      const existingLogo = await prisma.photo.findFirst({
        where: {
          entityType: EntityType.group,
          entityId: updatedGroup.id.toString(),
          type: PhotoType.logo,
        },
      });

            const logoPath = await uploadFile(logo, 'groups', updatedGroup.id.toString());

      if (existingLogo) {
        await prisma.photo.update({
          where: { id: existingLogo.id },
          data: {
            url: logoPath,
            user: { connect: { id: userId } },
          },
        });
        // After successfully updating the DB, delete the old image.
                await deleteFile(existingLogo.url);
      } else {
        await prisma.photo.create({
          data: {
            url: logoPath,
            type: PhotoType.logo,
            entityType: EntityType.group,
            entityId: updatedGroup.id.toString(),
            group: { connect: { id: updatedGroup.id } },
            user: { connect: { id: userId } },
          },
        });
      }
    }
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update group.');
  }

  revalidatePath('/admin/groups');
  revalidatePath(`/admin/groups/${groupData.slug}`);
  redirect('/admin/groups');
}

export async function searchUsers(groupId: number, query: string) {
  if (!query) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      groupMemberships: {
        none: {
          groupId: groupId,
        },
      },
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
    include: {
      photos: {
        where: {
          type: PhotoType.primary,
        },
        take: 1,
      },
    },
  });

  return Promise.all(
    users.map(async (user) => ({
      ...user,
      photoUrl: await (async () => {
        const rawUrl = user.photos[0]?.url;
        if (rawUrl) {
          if (rawUrl.startsWith('http')) {
            return rawUrl;
          }
          return getPublicUrl(rawUrl);
        }
        return '/images/default-avatar.png';
      })(),
    }))
  );
}

const AddMemberSchema = z.object({
  groupId: z.coerce.number(),
  userId: z.string(),
  role: z.nativeEnum(GroupUserRole),
  memberSince: z
    .preprocess(
      (val) => (val === '' ? null : val),
      z.coerce.number().int().optional().nullable(),
    )
    .transform((val) => val ?? new Date().getFullYear()),
});

export async function addMember(formData: FormData) {
  const validatedFields = AddMemberSchema.safeParse({
    groupId: formData.get('groupId'),
    userId: formData.get('userId'),
    role: formData.get('role'),
    memberSince: formData.get('memberSince'),
  });

  if (!validatedFields.success) {
    throw new Error('Invalid form data.');
  }

  const { groupId, userId, role, memberSince } = validatedFields.data;

  await prisma.groupUser.create({
    data: {
      groupId,
      userId,
      role,
      memberSince,
    },
  });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  revalidatePath(`/admin/groups/${group?.slug}/edit`);
}

const RemoveMemberSchema = z.object({
  groupId: z.coerce.number(),
  userId: z.string(),
});

export async function removeMember(formData: FormData) {
  const validatedFields = RemoveMemberSchema.safeParse({
    groupId: formData.get('groupId'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    throw new Error('Invalid form data.');
  }

  const { groupId, userId } = validatedFields.data;

  await prisma.groupUser.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  revalidatePath(`/admin/groups/${group?.slug}/edit`);
}

const UpdateMemberSchema = z.object({
  groupId: z.coerce.number(),
  userId: z.string(),
  role: z.nativeEnum(GroupUserRole),
  memberSince: z.preprocess(
    (val) => (val === '' ? null : val),
    z.coerce.number().int().optional().nullable()
  ),
});

export async function updateMember(formData: FormData) {
  const validatedFields = UpdateMemberSchema.safeParse({
    groupId: formData.get('groupId'),
    userId: formData.get('userId'),
    role: formData.get('role'),
    memberSince: formData.get('memberSince'),
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error);
    throw new Error('Invalid form data.');
  }

  const { groupId, userId, role, memberSince } = validatedFields.data;

  await prisma.groupUser.update({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    data: {
      role,
      memberSince,
    },
  });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  revalidatePath(`/admin/groups/${group?.slug}/edit`);
}
