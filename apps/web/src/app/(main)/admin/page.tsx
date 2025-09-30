import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <Breadcrumbs />
      <h1 className="mb-8 text-center text-3xl font-bold dark:text-white">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Link
          href="/admin/groups"
          className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-8 text-center text-2xl font-bold text-white shadow-lg transition-colors hover:bg-indigo-700"
        >
          Groups
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center justify-center rounded-lg bg-green-600 px-6 py-8 text-center text-2xl font-bold text-white shadow-lg transition-colors hover:bg-green-700"
        >
          Users
        </Link>
      </div>
    </div>
  )
}
