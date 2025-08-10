'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { uploadFile } from '@/lib/storage'
import { getCodeTable } from '@/lib/codes'
import { auth } from '@/auth'
import bcrypt from 'bcrypt'

const FormSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address.')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  photo: z
    .instanceof(File, { message: 'Photo is required.' })
    .optional()
    .refine(
      (file) => !file || file.size === 0 || file.type.startsWith('image/'),
      {
        message: 'Only images are allowed.',
      },
    )
    .refine((file) => !file || file.size < 10 * 1024 * 1024, {
      message: 'File is too large. Max 10MB.',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
})

export type State = {
  errors: {
    username?: string[]
    firstName?: string[]
    lastName?: string[]
    email?: string[]
    phone?: string[]
    photo?: string[]
    password?: string[]
  } | null
  message: string | null
  values: {
    username: string
    firstName: string
    lastName: string
    email: string
    phone: string
    password?: string
  }
}

export async function createUser(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      errors: null,
      message: 'You must be logged in to create a user.',
      values: {
        username: formData.get('username')?.toString() || '',
        firstName: formData.get('firstName')?.toString() || '',
        lastName: formData.get('lastName')?.toString() || '',
        email: formData.get('email')?.toString() || '',
        phone: formData.get('phone')?.toString() || '',
        password: formData.get('password')?.toString() || '',
      },
    }
  }
  const creatorId = session.user.id
  const validatedFields = FormSchema.safeParse({
    username: formData.get('username'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    photo: formData.get('photo'),
    password: formData.get('password'),
  })

  const formValues = {
    username: formData.get('username')?.toString() || '',
    firstName: formData.get('firstName')?.toString() || '',
    lastName: formData.get('lastName')?.toString() || '',
    email: formData.get('email')?.toString() || '',
    phone: formData.get('phone')?.toString() || '',
    password: formData.get('password')?.toString() || '',
  }

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      values: formValues,
    }
  }

  const { photo, password, ...userData } = validatedFields.data

  try {
    await prisma.$transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(password, 10)
      const newUser = await tx.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          firstName: userData.firstName || '',
          lastName: userData.lastName || null,
          email: userData.email || null,
          phone: userData.phone || null,
          createdBy: { connect: { id: creatorId } },
          updatedBy: { connect: { id: creatorId } },
        },
      })

      try {
        const [photoTypes, entityTypes] = await Promise.all([
          getCodeTable('photoType'),
          getCodeTable('entityType'),
        ])

        let photoUrl: string
        if (photo && photo.size > 0) {
          console.log('Photo provided, uploading...')
          photoUrl = await uploadFile(photo, 'user-photos', newUser.id)
        } else {
          console.log('No photo provided, generating default avatar...')
          photoUrl = `https://api.dicebear.com/8.x/personas/png?seed=${newUser.id}`
        }

        await tx.photo.create({
          data: {
            url: photoUrl,
            entityId: newUser.id,
            typeId: photoTypes.primary.id,
            entityTypeId: entityTypes.user.id,
            userId: creatorId,
          },
        })

        console.log('Photo record created successfully.')
      } catch (photoError) {
        console.error('Error creating or uploading photo:', photoError)
        // Throw an error to ensure the transaction is rolled back
        throw new Error('Failed to create photo for user.')
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return {
        message: 'This username is already taken.',
        errors: { username: ['Username must be unique.'] },
        values: formValues,
      }
    }
    console.error('Transaction failed:', error)
    return {
      errors: null,
      message: `Failed to create user: ${error.message}`,
      values: formValues,
    }
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}
