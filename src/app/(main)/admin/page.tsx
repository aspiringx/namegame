import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-white">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link
          href="/admin/groups"
          className="bg-indigo-600 text-white font-bold py-8 px-6 rounded-lg text-center text-2xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center"
        >
          Groups
        </Link>
        <Link
          href="/admin/users"
          className="bg-green-600 text-white font-bold py-8 px-6 rounded-lg text-center text-2xl hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center"
        >
          Users
        </Link>
      </div>
    </div>
  );
}
