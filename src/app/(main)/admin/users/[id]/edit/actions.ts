'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage';
import { getCodeTable } from '@/lib/codes';
import { auth } from '@/auth';

const FormSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
  photo: z
    .instanceof(File, { message: 'Photo is required.' })
    .optional()
    .refine((file) => !file || file.size === 0 || file.type.startsWith('image/'), {
      message: 'Only images are allowed.',
    })
    .refine((file) => !file || file.size < 10 * 1024 * 1024, {
      message: 'File is too large. Max 10MB.',
    }),
  removePhoto: z.boolean().default(false),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
  photoUrl: z.string().optional().nullable(),
});

export type State = {
  errors: {
    username?: string[];
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    phone?: string[];
    password?: string[];
    photo?: string[];
    removePhoto?: string[];
  } | null;
  message: string | null;
  success?: boolean;
  photoUrl?: string | null;
  values?: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
  };

};

export async function updateUser(id: string, prevState: State, formData: FormData): Promise<State> {
  const formValues = {
    username: formData.get('username')?.toString() || '',
    firstName: formData.get('firstName')?.toString() || '',
    lastName: formData.get('lastName')?.toString() || '',
    email: formData.get('email')?.toString() || '',
    phone: formData.get('phone')?.toString() || '',
  };

  const session = await auth();
  if (!session?.user?.id) {
    return {
      errors: null,
      message: 'You must be logged in to update a user.',
      values: {
        ...formValues,
        password: formData.get('password')?.toString() || '',
      },
    };
  }
  const updaterId = session.user.id;
  const validatedFields = FormSchema.safeParse({
    username: formData.get('username'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    photo: formData.get('photo'),
    removePhoto: formData.get('removePhoto') === 'true',
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      values: {
        ...formValues,
        password: formData.get('password')?.toString() || '',
      },
    };
  }

  const { photo, removePhoto, password, ...userData } = validatedFields.data;
  let photoUrl: string | null = null;

  try {
    const [photoTypes, entityTypes] = await Promise.all([
      getCodeTable('photoType'),
      getCodeTable('entityType'),
    ]);
    const primaryPhotoTypeId = photoTypes.primary.id;
    const userEntityTypeId = entityTypes.user.id;

    const dataToUpdate: any = {
      ...userData,
      lastName: userData.lastName || null,
      email: userData.email || null,
      phone: userData.phone || null,
      updatedBy: { connect: { id: updaterId } },
    };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    if (removePhoto) {
      const existingPhoto = await prisma.photo.findFirst({
        where: {
          entityId: id,
          entityTypeId: userEntityTypeId,
          typeId: primaryPhotoTypeId,
        },
      });

      if (existingPhoto) {
        await deleteFile(existingPhoto.url);
        await prisma.photo.delete({ where: { id: existingPhoto.id } });
      }

    } else if (photo && photo.size > 0) {
      const existingPhoto = await prisma.photo.findFirst({
        where: {
          entityId: id,
          entityTypeId: userEntityTypeId,
          typeId: primaryPhotoTypeId,
        },
      });

      const newPhotoPath = await uploadFile(photo, 'user-photos', id);
      photoUrl = await getPublicUrl(newPhotoPath);

      if (existingPhoto) {
        await deleteFile(existingPhoto.url);
        await prisma.photo.update({
          where: { id: existingPhoto.id },
          data: {
            url: newPhotoPath,
            typeId: primaryPhotoTypeId,
            entityTypeId: userEntityTypeId,
            entityId: id,
            userId: updaterId,
          },
        });
      } else {
        await prisma.photo.create({
          data: {
            url: newPhotoPath,
            typeId: primaryPhotoTypeId,
            entityTypeId: userEntityTypeId,
            entityId: id,
            userId: updaterId,
          },
        });
      }
    }
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return {
        message: 'This username is already taken.',
        errors: { username: ['Username must be unique.'] },
        values: { ...formValues, password: password || '' },
      };
    }
    console.error('Update user error:', error);
    return {
      errors: null,
      message: 'An unexpected error occurred. Please try again.',
      values: { ...formValues, password: password || '' },
    };
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}/edit`);
  revalidateTag('user-photo');

  return {
    ...prevState,
    message: 'User updated successfully.',
    errors: null,
    success: true,
    photoUrl,
  };
}
