'use client';

import { Button } from './Button';
import Link from 'next/link';

import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export function Header() {
  
  const user = "Placeholder"
  //TODO: Add either user context or supabase auth

  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Mentator
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="#Study" className="text-gray-600 hover:text-gray-900">Study</Link>
            <Link href="#Add Cards" className="text-gray-600 hover:text-gray-900">Add Cards</Link>
            <Link href="#Manage Decks" className="text-gray-600 hover:text-gray-900">Manage Decks</Link>
            {user && (
              <>
                <Link href="/data-points/new" className="text-gray-600 hover:text-gray-900">
                  Add Data Point
                </Link>
                <Link href="/datasets" className="text-gray-600 hover:text-gray-900">
                  Datasets
                </Link>
              </>
            )}
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-600">{user.email}</span>
                <Button variant="outline" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 