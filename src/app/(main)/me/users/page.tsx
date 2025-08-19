import { getManagedUsers } from './actions'
import UsersList from './users-list'
import {
  getUsersManagingMe,
  getPotentialManagers,
} from '@/lib/actions'

export default async function UsersPage(props: {
  searchParams?: Promise<{ success?: string }>
}) {
  const searchParams = await props.searchParams
  const [managedUsers, usersManagingMe, potentialManagers] = await Promise.all([
    getManagedUsers(),
    getUsersManagingMe(),
    getPotentialManagers(),
  ])

  return (
    <UsersList
      managedUsers={managedUsers}
      usersManagingMe={usersManagingMe}
      potentialManagers={potentialManagers}
      successMessage={searchParams?.success}
    />
  )
}
