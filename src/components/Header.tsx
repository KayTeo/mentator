'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  description?: string;
}

/**
 * Header component that displays navigation and user information
 * 
 * This component shows the main navigation menu and user account
 * information. It automatically handles authentication state and
 * provides sign out functionality.
 */
export function Header({}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (!user) {
    return null;
  }

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/study" className="text-2xl font-bold text-blue-600">
              Mentator
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/study" className="text-gray-600 hover:text-gray-900">Study</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/add_data" className="text-gray-600 hover:text-gray-900">Add Data</Link>
            <Link href="/manage_datasets" className="text-gray-600 hover:text-gray-900">Manage Datasets</Link>
            <Link href="/view_dataset" className="text-gray-600 hover:text-gray-900">View Dataset</Link>
          </nav>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={toggleDropdown}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
              <span className="hidden md:inline-block">{user.email}</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 