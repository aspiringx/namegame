'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center px-5 h-full">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          NameGame
        </Link>
        <div className="flex items-center">
          <div className="relative">
            {user ? (
              <>
                <Image
                  src={user.image || '/default-user.png'}
                  alt={user.name || 'User Profile'}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-indigo-600"
                  onClick={toggleDropdown}
                />
                {isDropdownOpen && (
                  <div className="absolute top-14 right-0 bg-white rounded-md shadow-lg py-2 z-50 w-48">
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
