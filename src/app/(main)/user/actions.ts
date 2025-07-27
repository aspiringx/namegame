'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCodeTable } from '@/lib/codes';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage';
import { sendVerificationEmail } from '@/lib/mail';

export type State = {
  success: boolean;
  error: string | null;
  message: string | null;
  newPhotoUrl?: string | null;
  newFirstName?: string | null;
  redirectUrl?: string | null;
};

const UserProfileSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
  // username: z.string().min(3, 'Username must be at least 3 characters long.'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  photo: z.instanceof(File).optional(),
});

export async function updateUserProfile(prevState: State, formData: FormData): Promise<State> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to update your profile.', message: null };
  }

  const validatedFields = UserProfileSchema.safeParse({
    // username: formData.get('username'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    photo: formData.get('photo'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid data provided. Please check the form and try again.', message: null };
  }

  // const { username, firstName, lastName, photo, password } = validatedFields.data;
  const { firstName, lastName, email, photo, password } = validatedFields.data;
  const userId = session.user.id;
  
  let newPhotoKey: string | null = null;
  let updatedUser;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });

    if (!currentUser) {
      return { success: false, error: 'User not found.', message: null };
    }
    const [photoTypes, entityTypes, groupUserRoles] = await Promise.all([
      getCodeTable('photoType'),
      getCodeTable('entityType'),
      getCodeTable('groupUserRole'),
    ]);

    // Handle photo upload first
    if (photo && photo.size > 0) {
      const existingPhoto = await prisma.photo.findFirst({
        where: {
          entityTypeId: entityTypes.user.id,
          typeId: photoTypes.primary.id,
          entityId: userId,
        },
      });

      // Upload new photo
      const photoKey = await uploadFile(photo, 'user-photos', userId);
      newPhotoKey = photoKey;


      if (existingPhoto) {
        // Note: We are now deleting based on the new key format if the URL is not a full URL.
        // This assumes old keys might be stored differently.
        const keyToDelete = existingPhoto.url.startsWith('http') ? new URL(existingPhoto.url).pathname.substring(1) : existingPhoto.url;
        await deleteFile(keyToDelete);
        await prisma.photo.update({
          where: { id: existingPhoto.id },
          data: { url: photoKey, userId: userId },
        });
      } else {
        await prisma.photo.create({
          data: {
            url: photoKey,
            typeId: photoTypes.primary.id,
            entityTypeId: entityTypes.user.id,
            entityId: userId,
            userId: userId,
          },
        });
      }
    }

    const dataToUpdate: any = {
      firstName,
      lastName,
    };

    let emailChanged = false;
    if (email && (email !== currentUser.email || !currentUser.emailVerified)) {
      dataToUpdate.email = email;
      dataToUpdate.emailVerified = null; // Mark new email as unverified
      emailChanged = true;
    }

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    if (emailChanged && updatedUser.email) {
      await sendVerificationEmail(updatedUser.email, userId);
    }

    const hasPrimaryPhoto = await prisma.photo.findFirst({
      where: {
        entityId: userId,
        entityTypeId: entityTypes.user.id,
        typeId: photoTypes.primary.id,
      },
    });

    if (updatedUser.lastName && hasPrimaryPhoto) {
      await prisma.groupUser.updateMany({
        where: {
          userId: userId,
          roleId: groupUserRoles.guest.id,
        },
        data: {
          roleId: groupUserRoles.member.id,
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

  const userGroups = await prisma.groupUser.findMany({
    where: { userId: userId },
    select: { group: { select: { slug: true } } },
  });

  let redirectUrl: string | null = null;
  // if (userGroups.length === 1 && userGroups[0].group.slug) {
  //   redirectUrl = `/g/${userGroups[0].group.slug}`;
  // }

  let cacheBustedUrl: string | null = null;
  if (newPhotoKey) {
    const newPhotoPublicUrl = await getPublicUrl(newPhotoKey);
    cacheBustedUrl = `${newPhotoPublicUrl}?v=${Date.now()}`;
  }

  return {
    success: true,
    message: 'Profile updated successfully!',
    error: null,
    newPhotoUrl: cacheBustedUrl,
    newFirstName: updatedUser.firstName,
    redirectUrl,
  };
}
