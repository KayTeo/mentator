'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

// Create Supabase client once outside hook to prevent re-creation on every render
const supabase = createClient();

interface UseAuthOptions {
  /** Whether to redirect to login if user is not authenticated */
  requireAuth?: boolean;
  /** Where to redirect if user is not authenticated */
  redirectTo?: string;
  /** Whether to redirect authenticated users away from auth pages */
  redirectIfAuthenticated?: boolean;
  /** Where to redirect authenticated users from auth pages */
  redirectAuthenticatedTo?: string;
}

interface UseAuthReturn {
  /** Current user object */
  user: User | null;
  /** Whether authentication state is being loaded */
  loading: boolean;
  /** Any authentication error */
  error: string | null;
  /** Sign out function */
  signOut: () => Promise<void>;
}

/**
 * Custom hook for handling authentication state and redirects
 * 
 * This hook provides a centralized way to manage authentication state
 * across the application, with built-in redirect logic for protected
 * and public pages.
 * 
 * @param options - Configuration options for authentication behavior
 * @returns Authentication state and utilities
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    requireAuth = false,
    redirectTo = '/login',
    redirectIfAuthenticated = false,
    redirectAuthenticatedTo = '/study'
  } = options;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }

        if (mounted) {
          setUser(user);
          setError(null);

          // Handle redirects based on authentication state
          if (requireAuth && !user) {
            // User is not authenticated but auth is required
            router.push(redirectTo);
          } else if (redirectIfAuthenticated && user) {
            // User is authenticated but shouldn't be on this page
            router.push(redirectAuthenticatedTo);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication error');
          if (requireAuth) {
            router.push(redirectTo);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Get initial user state
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          
          // Handle auth state change redirects
          if (event === 'SIGNED_IN') {
            if (redirectIfAuthenticated) {
              router.push(redirectAuthenticatedTo);
            }
          } else if (event === 'SIGNED_OUT') {
            if (requireAuth) {
              router.push(redirectTo);
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requireAuth, redirectTo, redirectIfAuthenticated, redirectAuthenticatedTo, router]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out error');
    }
  };

  return {
    user,
    loading,
    error,
    signOut
  };
} 