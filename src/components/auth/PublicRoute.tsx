'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PublicRouteProps {
  /** The content to render if user is not authenticated */
  children: ReactNode;
  /** Where to redirect if user is authenticated */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: ReactNode;
}

/**
 * A component that handles public routes by redirecting authenticated users
 * 
 * This component is used for pages like login and signup that should not
 * be accessible to authenticated users. It automatically redirects them
 * to the dashboard or another specified page.
 * 
 * @param props - Component props
 * @returns Public content or loading state
 */
export function PublicRoute({
  children,
  redirectTo = '/study',
  loadingComponent
}: PublicRouteProps) {
  const { user, loading } = useAuth({
    redirectIfAuthenticated: true,
    redirectAuthenticatedTo: redirectTo
  });

  // Show loading state while checking authentication
  if (loading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show public content if user is not authenticated
  if (!user) {
    return <>{children}</>;
  }

  // This should not be reached due to redirect, but fallback
  return null;
} 