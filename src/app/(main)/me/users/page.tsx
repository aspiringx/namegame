import { getManagedUsers } from './actions'
import UsersList from './users-list'

export default async function UsersPage({ searchParams }: { searchParams: { success?: string } }) {
  const managedUsers = await getManagedUsers()

  return <UsersList managedUsers={managedUsers} successMessage={searchParams.success} />
}
