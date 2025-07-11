import Link from 'next/link';

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Global Admin</h1>
      <nav>
        <ul>
          <li>
            <Link href="/admin/groups" className="text-indigo-600 hover:text-indigo-800 hover:underline">
              Manage Groups
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
