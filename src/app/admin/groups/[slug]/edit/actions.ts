'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { EntityType, PhotoType } from '@/generated/prisma';
import { processImage, deleteImage } from '@/lib/photo-processing';

// Define the schema for form validation using Zod
const GroupSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.instanceof(File).optional(),
});

export async function updateGroup(groupId: number, formData: FormData) {
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
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { ...groupData },
    });

    if (logo && logo.size > 0) {
      const existingLogo = await prisma.photo.findFirst({
        where: {
          entityType: EntityType.group,
          entityId: updatedGroup.id,
          type: PhotoType.logo,
        },
      });

      const logoPath = await processImage(logo, updatedGroup.id);

      // TODO: This is a placeholder for real authentication.
      let adminUser = await prisma.user.findFirst();
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: { firstName: 'Default', lastName: 'Admin' },
        });
      }

      if (existingLogo) {
        await prisma.photo.update({
          where: { id: existingLogo.id },
          data: {
            url: logoPath,
            user: { connect: { id: adminUser.id } },
          },
        });
        // After successfully updating the DB, delete the old image.
        await deleteImage(existingLogo.url);
      } else {
        await prisma.photo.create({
          data: {
            url: logoPath,
            type: PhotoType.logo,
            entityType: EntityType.group,
            entityId: updatedGroup.id,
            group: { connect: { id: updatedGroup.id } },
            user: { connect: { id: adminUser.id } },
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
