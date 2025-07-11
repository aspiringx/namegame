'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { EntityType, PhotoType } from '@/generated/prisma';
import { uploadFile } from '@/lib/storage';
import bcrypt from 'bcrypt';

// Define the schema for form validation using Zod
const GroupSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.instanceof(File).optional(),
});

export type State = {
  errors?: {
    name?: string[];
    slug?: string[];
    description?: string[];
    address?: string[];
    phone?: string[];
    logo?: string[];
  };
  message?: string | null;
  values?: {
    name: string;
    slug: string;
    description: string;
    address: string;
    phone: string;
  };
};

export async function createGroup(prevState: State, formData: FormData): Promise<State> {
  // Extract and validate data
  const validatedFields = GroupSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    logo: formData.get('logo'),
  });

  // Keep a reference to the raw form data
  const rawFormData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    address: formData.get('address') as string,
    phone: formData.get('phone') as string,
    logo: formData.get('logo') as File,
  };

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorFields = Object.keys(fieldErrors)
      .map((field) => field.charAt(0).toUpperCase() + field.slice(1))
      .join(', ');

    return {
      errors: fieldErrors,
      message: `Please correct the invalid fields: ${errorFields}.`,
      values: rawFormData,
    };
  }

  const { logo, ...groupData } = validatedFields.data;

  try {
    const existingGroup = await prisma.group.findUnique({
      where: { slug: validatedFields.data.slug },
    });

    if (existingGroup) {
      return {
        errors: { slug: ['This slug is already in use.'] },
        message: 'Slug is already in use.',
        values: rawFormData,
      };
    }

    const newGroup = await prisma.group.create({
      data: {
        ...groupData,
        // This is a placeholder for idTree logic
        idTree: Math.random().toString(36).substring(2, 15),
      },
    });

    if (logo && logo.size > 0) {
            const logoPath = await uploadFile(logo, 'groups', newGroup.id);

      // TODO: This is a placeholder for real authentication.
      let adminUser = await prisma.user.findFirst();
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        adminUser = await prisma.user.create({
          data: {
            username: 'admin',
            firstName: 'Default',
            lastName: 'Admin',
            password: hashedPassword,
          },
        });
      }

      await prisma.photo.create({
        data: {
          url: logoPath,
          type: PhotoType.logo,
          entityType: EntityType.group,
          entityId: newGroup.id,
          group: {
            connect: { id: newGroup.id },
          },
          user: {
            connect: { id: adminUser.id },
          },
        },
      });
    }
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to create group.',
      values: rawFormData,
    };
  }

  // Revalidate the path to show the new group in the list and redirect
  revalidatePath('/admin/groups');
  redirect('/admin/groups');

  // This part is unreachable due to the redirect, but satisfies TypeScript
  return { message: 'Successfully created group.' };
}
