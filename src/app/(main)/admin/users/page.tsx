import Link from 'next/link'
import { Search } from './Search'
import UsersTable from './UsersTable'
import { Suspense } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'

export const dynamic = 'force-dynamic'

type SortableColumn =
  | 'username'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'createdAt'
  | 'updatedAt'
type Order = 'asc' | 'desc'

export default async function AdminUsersPage({
  searchParams: searchParamsProp,
}: {
  searchParams?: Promise<{
    query?: string
    sort?: SortableColumn
    order?: Order
    page?: string
  }>
}) {
  const searchParams = await searchParamsProp
  const query = searchParams?.query || ''
  const sort = searchParams?.sort || 'createdAt'
  const order = searchParams?.order || 'desc'
  const page = Number(searchParams?.page) || 1

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Breadcrumbs />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2 pr-4">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p>
            These are all the users in the system. Soft-deleted users are
            inactive and may be undeleted to reactivate them.
          </p>
        </div>
        <Link
          href="/admin/users/create"
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          Create
        </Link>
      </div>
      <div className="mt-4">
        <Search placeholder="Search users..." />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable query={query} sort={sort} order={order} page={page} />
      </Suspense>
    </div>
  )
}
