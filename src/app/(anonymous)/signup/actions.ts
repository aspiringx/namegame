'use server';

import { User } from '@/generated/prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { getCodeTable } from '@/lib/codes';
import { sendVerificationEmail } from '@/lib/mail';

const SignupSchema = z.object({
  email: z.string().email('Invalid email address.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  password: z
    .string()
    .min(6, 'At least 6 characters with text and numbers.')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'Must contain letters and numbers.'
    ),
});

export type SignupState = {
  errors?: {
    email?: string[];
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
    email: formData.get('email'),
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

  const { email, firstName, lastName, password } = validatedFields.data;

  if (password === 'password123') {
    return {
      errors: {
        password: ['Please choose a more secure password.'],
      },
      message: 'Invalid form data. Please correct the errors and try again.',
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { message: 'Email is already taken.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser: User | undefined;

    // When creating a new user through the /signup form (not via greeting code)
    // we require email. Since username is also required, set it to email
    // value too so it's unique.
    await prisma.$transaction(async (tx) => {
      newUser = await tx.user.create({
        data: {
          email,
          username: email,
          firstName,
          lastName,
          password: hashedPassword,
        },
      });

      // Use the user's ID as a seed for a unique, deterministic avatar
      const avatarUrl = `https://api.dicebear.com/8.x/personas/png?seed=${newUser.id}`;

      const [photoTypes, entityTypes] = await Promise.all([
        getCodeTable('photoType'),
        getCodeTable('entityType'),
      ]);

      await tx.photo.create({
        data: {
          url: avatarUrl,
          typeId: photoTypes.primary.id,
          entityTypeId: entityTypes.user.id,
          entityId: newUser.id,
          userId: newUser.id,
        },
      });
    });

    if (newUser && newUser.email) {
      await sendVerificationEmail(newUser.email, newUser.id);
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to create user.',
    };
  }

  redirect('/check-email');
}
