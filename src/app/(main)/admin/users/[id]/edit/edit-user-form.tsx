'use client'

import { useSession } from 'next-auth/react'
import type { User } from '@/generated/prisma'
import GlobalUserForm, { type UserFormData, type UserFormState } from '@/components/GlobalUserForm'
import { updateUser, getUserUpdateRequirements } from './actions'

export default function EditUserForm({
  user,
  photoUrl,
  hasPhoto,
}: {
  user: User
  photoUrl: string
  hasPhoto: boolean
}) {
  const { data: session, update } = useSession()

  const initialState: UserFormState = {
    message: null,
    errors: null,
    values: {
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
    },
  }

  const updateUserWithId = updateUser.bind(null, user.id)

  const userData: UserFormData = {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    birthDate: user.birthDate,
    birthPlace: user.birthPlace,
    deathDate: user.deathDate,
    emailVerified: user.emailVerified,
  }

  return (
    <GlobalUserForm
      mode="edit"
      user={userData}
      photoUrl={photoUrl}
      hasPhoto={hasPhoto}
      onSubmit={updateUserWithId}
      initialState={initialState}
      onPasswordRequirementCheck={getUserUpdateRequirements}
      submitButtonText="Save Changes"
      submitButtonPendingText="Saving..."
    />
  )
}
