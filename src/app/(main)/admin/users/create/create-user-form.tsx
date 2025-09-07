'use client'

import GlobalUserForm, { type UserFormState } from '@/components/GlobalUserForm'
import { createUser, type State } from './actions'

export default function CreateUserForm() {
  const initialState: UserFormState = {
    message: null,
    errors: null,
    values: {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    },
  }

  // Create a wrapper function to handle the type conversion
  const handleCreateUser = async (prevState: UserFormState, formData: FormData): Promise<UserFormState> => {
    // Convert UserFormState to State for the createUser function
    const stateForCreate: State = {
      message: prevState.message,
      errors: prevState.errors || {},
      values: prevState.values || {
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
      },
    }
    
    // Call the original createUser function
    const result = await createUser(stateForCreate, formData)
    
    // Convert State back to UserFormState
    return {
      message: result.message,
      errors: result.errors,
      values: result.values,
    }
  }

  return (
    <GlobalUserForm
      mode="create"
      onSubmit={handleCreateUser}
      initialState={initialState}
      submitButtonText="Create User"
      submitButtonPendingText="Creating..."
    />
  )
}
