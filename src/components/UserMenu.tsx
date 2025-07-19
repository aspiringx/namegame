'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function UserMenu() {
  const { data: session, update } = useSession();
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      update();
    }
  };
  const user = session?.user;
  const isSuperAdmin = user?.isSuperAdmin;
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

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        {user && <p className="mr-4 text-gray-700 dark:text-gray-300">{user.firstName}</p>}
        <Image
          src={user?.image || '/images/default-avatar.png'}
          alt="User Profile"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full"
          onError={handleImageError}
        />
      </button>
      {isDropdownOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-md shadow-lg py-2 z-50 w-48 dark:bg-gray-800">
          {user ? (
            <>
              <Link
                href={`/user`}
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={closeDropdown}
              >
                My Profile
              </Link>
              {isSuperAdmin && (
                <>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Global Admin
                  </Link>
                  <Link
                    href="/admin/groups"
                    className="block pl-8 pr-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Groups
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block pl-8 pr-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Users
                  </Link>
                </>
              )}
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/' });
                  closeDropdown();
                }}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Sign Up
              </Link>
            </>
          )}
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <Link
            href="/"
            className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={closeDropdown}
          >
            How to Play
          </Link>
        </div>
      )}
    </div>
  );
}
