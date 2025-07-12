'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { EntityType, PhotoType } from '@/generated/prisma';

const SignupSchema = z.object({
  username: z.string().min(3, 'Username must be at least three characters.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().optional(),
  password: z
    .string()
    .min(6, 'Must be at least 6 characters.')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'Must contain both letters and numbers.'
    ),
});

export type SignupState = {
  errors?: {
    username?: string[];
    firstName?: string[];
    lastName?: string[];
    password?: string[];
  };
  message?: string | null;
};

export async function signup(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const validatedFields = SignupSchema.safeParse({
    username: formData.get('username'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid form data. Please correct the errors and try again.',
    };
  }

  const { username, firstName, lastName, password } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { message: 'Username is already taken.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          firstName,
          lastName: lastName || null,
          password: hashedPassword,
        },
      });

      // Use the user's ID as a seed for a unique, deterministic avatar
      const avatarUrl = `https://api.dicebear.com/8.x/micah/png?seed=${newUser.id}`;

      await tx.photo.create({
        data: {
          url: avatarUrl,
          type: PhotoType.primary,
          entityType: EntityType.user,
          entityId: newUser.id,
          userId: newUser.id,
        },
      });
    });
  } catch (error) {
    return {
      message: 'Database Error: Failed to create user.',
    };
  }

  redirect('/login');
}
