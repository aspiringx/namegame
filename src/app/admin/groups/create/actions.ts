'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { EntityType, PhotoType } from '@/generated/prisma';
import { processImage } from '@/lib/photo-processing';
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

export async function createGroup(formData: FormData) {
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
    // In a real app, you'd return these errors to the form
    console.error(validatedFields.error);
    throw new Error('Invalid form data.');
  }

  const { logo, ...groupData } = validatedFields.data;

  try {
    const newGroup = await prisma.group.create({
      data: {
        ...groupData,
        // This is a placeholder for idTree logic
        idTree: Math.random().toString(36).substring(2, 15),
      },
    });

    if (logo && logo.size > 0) {
      const logoPath = await processImage(logo, newGroup.id);

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
    throw new Error('Failed to create group.');
  }

  // Revalidate the path to show the new group in the list
  revalidatePath('/admin/groups');
  // Redirect to the group list page
  redirect('/admin/groups');
}
