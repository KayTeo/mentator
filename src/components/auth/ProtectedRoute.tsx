'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  /** The content to render if user is authenticated */
  children: ReactNode;
  /** Where to redirect if user is not authenticated */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom error component */
  errorComponent?: ReactNode;
}

/**
 * A component that protects routes requiring authentication
 * 
 * This component automatically handles authentication checks and redirects
 * for pages that require user login. It shows appropriate loading and
 * error states while authentication is being verified.
 * 
 * @param props - Component props
 * @returns Protected content or loading/error states
 */
export function ProtectedRoute({
  children,
  redirectTo = '/',
  loadingComponent,
  errorComponent
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth({
    requireAuth: true,
    redirectTo
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

  // Show error state if authentication failed
  if (error) {
    return errorComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Show protected content if user is authenticated
  if (user) {
    return <>{children}</>;
  }

  // This should not be reached due to redirect, but fallback
  return null;
} 