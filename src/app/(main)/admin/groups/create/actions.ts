'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { EntityType, PhotoType } from '@/generated/prisma';
import { uploadFile } from '@/lib/storage';
import { auth } from '@/auth';

// Define the schema for form validation using Zod
const GroupSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.string().optional(), // Logo is a base64 string
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
  const session = await auth();
  if (!session?.user?.id) {
    return {
      message: 'You must be logged in to create a group.',
    };
  }
  const userId = session.user.id;

  const validatedFields = GroupSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    logo: formData.get('logo'),
  });

  const rawFormData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    address: formData.get('address') as string,
    phone: formData.get('phone') as string,
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
      where: { slug: groupData.slug },
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
        idTree: Math.random().toString(36).substring(2, 15), // Placeholder
        createdById: userId,
        updatedById: userId,
      },
    });

    if (logo) {
      const matches = logo.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const file = new File([buffer], 'logo.jpg', { type: mimeType });

        const logoPath = await uploadFile(file, 'groups', newGroup.id.toString());

        await prisma.photo.create({
          data: {
            url: logoPath,
            entityId: newGroup.id.toString(),
            entityType: EntityType.group,
            type: PhotoType.logo,
            group: {
              connect: { id: newGroup.id },
            },
            user: {
              connect: { id: userId },
            },
          },
        });
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      message: `Database Error: ${message}`,
      values: rawFormData,
    };
  }

  revalidatePath('/admin/groups');
  redirect('/admin/groups');
}
