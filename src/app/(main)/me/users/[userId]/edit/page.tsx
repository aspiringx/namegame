import { getGroupDataForEditPage } from '@/app/(main)/me/users/groups/queries'
import ManagedUserProfileForm from '@/app/(main)/me/_components/managed-user-profile-form'
import { notFound } from 'next/navigation'

export default async function EditManagedUserPage(props: {
  params: { userId: string }
}) {
  const { userId } = (await props.params) as { userId: string }
  const { managedUser, authdUserGroups } = await getGroupDataForEditPage(userId)

  if (!managedUser) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Edit Managed User</h1>
      <ManagedUserProfileForm user={managedUser} authdUserGroups={authdUserGroups} />
    </div>
  )
}
