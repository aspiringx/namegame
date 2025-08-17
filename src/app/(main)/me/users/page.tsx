import { getManagedUsers } from './actions'
import UsersList from './users-list'

export default async function UsersPage(props: {
  searchParams?: Promise<{ success?: string }>
}) {
  const searchParams = await props.searchParams
  const managedUsers = await getManagedUsers()

  return <UsersList managedUsers={managedUsers} successMessage={searchParams?.success} />
}
