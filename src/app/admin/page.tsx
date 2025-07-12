import Link from 'next/link';
import Breadcrumbs from '../../components/Breadcrumbs';

export default function AdminPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6">Global Admin</h1>
      <nav>
        <ul>
          <li>
            <Link href="/admin/groups" className="text-indigo-600 hover:text-indigo-800 hover:underline">
              Manage Groups
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-800 hover:underline">
              Manage Users
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
