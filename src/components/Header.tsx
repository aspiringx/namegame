import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/auth';
import UserMenu from './UserMenu';

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center px-5 h-full">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          NameGame
        </Link>
        <div className="flex items-center">
          {user && <p className="mr-4 text-gray-700">Hi, {user.firstName}</p>}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
