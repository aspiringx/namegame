'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.roles?.some(
    (role) => role.groupSlug === 'global-admin' && role.role === 'super'
  );
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="flex items-center">
      {user && <p className="mr-4 text-gray-700 dark:text-gray-300">{user.firstName}</p>}
      <div className="relative" ref={dropdownRef}>
      <Image
        src={user?.image || '/images/default-avatar.png'}
        alt="User Profile"
        width={40}
        height={40}
        className="w-10 h-10 rounded-full cursor-pointer"
        onClick={toggleDropdown}
      />
      {isDropdownOpen && (
        <div className="absolute top-14 right-0 bg-white rounded-md shadow-lg py-2 z-50 w-48">
          {user ? (
            <>
              {isSuperAdmin && (
                <>
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Admin
                  </Link>
                  <Link
                    href="/admin/groups"
                    className="block pl-8 pr-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Groups
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block pl-8 pr-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Users
                  </Link>
                </>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
