import Link from 'next/link';
import { Search } from './Search';
import UsersTable from './UsersTable';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

type SortableColumn = 'username' | 'firstName' | 'lastName' | 'email' | 'phone' | 'createdAt' | 'updatedAt';
type Order = 'asc' | 'desc';


export default async function AdminUsersPage({ searchParams: searchParamsProp }: {
  searchParams?: Promise<{
    query?: string;
    sort?: SortableColumn;
    order?: Order;
  }>;
}) {
  const searchParams = await searchParamsProp;
  const query = searchParams?.query || '';
  const sort = searchParams?.sort || 'createdAt';
  const order = searchParams?.order || 'desc';

  return (
        <div className="max-w-4xl mx-auto p-8">
      <Breadcrumbs />
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2 pr-4">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p>
            These are all the users in the system. Soft-deleted users are inactive 
            and may be undeleted to reactivate them. 
          </p>
        </div>
        <Link
          href="/admin/users/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create
        </Link>
      </div>
      <div className="mt-4">
        <Search placeholder="Search users..." />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable query={query} sort={sort} order={order} /> 
      </Suspense>
    </div>
  );
}
