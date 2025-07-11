import Image from 'next/image';
import Link from 'next/link';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full">
      <div className="container mx-auto flex justify-between items-center px-5 py-3 h-full">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          NameGame
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
