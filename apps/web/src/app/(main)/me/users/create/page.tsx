import { auth } from '@/auth' // Adjust if your auth setup is different
import ManagedUserProfileForm from '@/app/(main)/me/_components/managed-user-profile-form'

export default async function CreateManagedUserPage() {
  const session = await auth()

  if (!session?.user) {
    // Or redirect to login
    return <p>You must be logged in to create a managed user.</p>
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Create New Managed User</h1>
      <ManagedUserProfileForm />
    </div>
  )
}
