'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { deleteFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export interface FormState {
  message?: string;
  errors?: {
    username?: string[];
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    phone?: string[];
  };
}

const UserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
});

// Placeholder for createUser
export async function createUser(prevState: FormState, formData: FormData): Promise<FormState> {
  // Implementation to come
  return { message: 'User creation not yet implemented.' };
}

// Placeholder for updateUser
export async function updateUser(userId: string, prevState: FormState, formData: FormData): Promise<FormState> {
  // Implementation to come
  return { message: 'User update not yet implemented.' };
}

export async function softDeleteUser(userId: string) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return { success: false, message: 'You must be logged in to perform this action.' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        updatedBy: { connect: { id: currentUserId } }
      },
    });
    revalidatePath('/admin/users');
    return { success: true, message: 'User soft-deleted successfully.' };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, message: 'Failed to soft-delete user.' };
  }
}

export async function undeleteUser(userId: string) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return { success: false, message: 'You must be logged in to perform this action.' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: null,
        updatedBy: { connect: { id: currentUserId } }
      },
    });
    revalidatePath('/admin/users');
    return { success: true, message: 'User restored successfully.' };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, message: 'Failed to restore user.' };
  }
}

export async function hardDeleteUser(userId: string) {
  try {
    const photos = await prisma.photo.findMany({
      where: { userId: userId },
    });

    for (const photo of photos) {
      if (photo.url) {
        await deleteFile(photo.url);
      }
    }

    await prisma.$transaction([
      prisma.photo.deleteMany({
        where: { userId: userId },
      }),
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    revalidatePath('/admin/users');
    return { success: true, message: 'User permanently deleted.' };
  } catch (error: any) {
    console.error('Hard Delete Error:', error);
    if (error.code === 'P2003') { // Foreign key constraint
      return { success: false, message: 'Cannot delete user. They may be associated with other records.' };
    }
    return { success: false, message: 'Failed to permanently delete user.' };
  }
}
