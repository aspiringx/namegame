'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { User } from 'next-auth';

interface UserMenuProps {
  user: User | undefined;
}

export default function UserMenu({ user }: UserMenuProps) {
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
    <div className="relative" ref={dropdownRef}>
      <Image
        src={user?.image || '/images/user-icon.png'}
        alt="User Profile"
        width={40}
        height={40}
        className="w-10 h-10 rounded-full cursor-pointer"
        onClick={toggleDropdown}
      />
      {isDropdownOpen && (
        <div className="absolute top-14 right-0 bg-white rounded-md shadow-lg py-2 z-50 w-48">
          {user ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
            >
              Logout
            </button>
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
  );
}
