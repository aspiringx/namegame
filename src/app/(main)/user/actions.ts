'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { GroupUserRole } from '@/generated/prisma';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage';

export type State = {
  success: boolean;
  error: string | null;
  message: string | null;
  newPhotoUrl?: string | null;
  newFirstName?: string | null;
};

const UserProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long.'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  photo: z.instanceof(File).optional(),
});

export async function updateUserProfile(prevState: State, formData: FormData): Promise<State> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to update your profile.', message: null };
  }

  const validatedFields = UserProfileSchema.safeParse({
    username: formData.get('username'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    photo: formData.get('photo'),
  });

  if (!validatedFields.success) {
    // A more detailed error message can be constructed from validatedFields.error.flatten().fieldErrors
    return { success: false, error: 'Invalid data provided. Please check the form and try again.', message: null };
  }

  const { username, firstName, lastName, photo } = validatedFields.data;
  const userId = session.user.id;
  let newPublicUrl: string | null = null;
  let updatedUser;

  try {
    // Handle photo upload first
    if (photo && photo.size > 0) {
      const existingPhoto = await prisma.photo.findFirst({
        where: { entityId: userId, entityType: 'user', type: 'primary' },
      });

      // Upload new photo
      const photoKey = await uploadFile(photo, 'user-photos', userId);
      const publicUrl = await getPublicUrl(photoKey);
      // Append a timestamp to bust the cache
      newPublicUrl = `${publicUrl}?t=${new Date().getTime()}`;

      // Delete old photo from storage if it exists
      if (existingPhoto) {
        await deleteFile(existingPhoto.url);
        await prisma.photo.update({
          where: { id: existingPhoto.id },
          data: { url: photoKey },
        });
      } else {
        await prisma.photo.create({
          data: {
            url: photoKey,
            type: 'primary',
            entityType: 'user',
            entityId: userId,
          },
        });
      }
    }

    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        firstName,
        lastName,
      },
    });

    // Check for profile completeness to promote from guest to member
    const hasPrimaryPhoto = await prisma.photo.findFirst({
      where: { entityId: userId, entityType: 'user', type: 'primary' },
    });

    if (updatedUser.lastName && hasPrimaryPhoto) {
      // firstName is already required by the Zod schema
      await prisma.groupUser.updateMany({
        where: {
          userId: userId,
          role: GroupUserRole.guest,
        },
        data: {
          role: GroupUserRole.member,
        },
      });
    }


  } catch (error) {
    console.error('Failed to update user profile:', error);
    if ((error as any).code === 'P2002') {
      const target = (error as any).meta?.target;
      if (target?.includes('username')) {
        return { success: false, error: 'This username is already taken.', message: null };
      }
    }
    return { success: false, error: 'An unexpected error occurred. Please try again.', message: null };
  }

  revalidatePath('/user');
  revalidatePath('/', 'layout'); // Revalidate header
  revalidateTag('user-photo');

  // Append a timestamp to the URL to bust the cache. This is the key to ensuring the new image is displayed.
  const cacheBustedUrl = newPublicUrl ? `${newPublicUrl}?v=${Date.now()}` : null;

  return {
    success: true,
    message: 'Profile updated successfully!',
    error: null,
    newPhotoUrl: cacheBustedUrl,
    newFirstName: updatedUser.firstName,
  };
}
