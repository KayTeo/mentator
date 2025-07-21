# Authentication System Guide

This guide explains how authentication is implemented in the Mentator application and how to use it effectively.

## Overview

The authentication system provides a centralized way to handle user authentication across the application. It includes:

- **useAuth Hook**: A custom React hook for managing authentication state
- **ProtectedRoute Component**: A wrapper component for pages requiring authentication
- **PublicRoute Component**: A wrapper component for public pages that redirect authenticated users

## Components

### useAuth Hook

The `useAuth` hook provides authentication state and utilities:

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, error, signOut } = useAuth({
    requireAuth: true,           // Redirect to login if not authenticated
    redirectTo: '/login',        // Where to redirect unauthenticated users
    redirectIfAuthenticated: false, // Redirect authenticated users away
    redirectAuthenticatedTo: '/study' // Where to redirect authenticated users
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Not authenticated</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

### ProtectedRoute Component

Use this component to protect pages that require authentication:

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

### PublicRoute Component

Use this component for public pages that should redirect authenticated users:

```typescript
import { PublicRoute } from '@/components/auth/PublicRoute';

function LoginPage() {
  return (
    <PublicRoute>
      <div>Login form - authenticated users will be redirected</div>
    </PublicRoute>
  );
}
```

## Implementation Examples

### Protected Pages

For pages that require authentication (like study, dashboard, etc.):

```typescript
// src/app/study/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function StudyPageContent() {
  // Your page content here
  return <div>Study content</div>;
}

export default function StudyPage() {
  return (
    <ProtectedRoute>
      <StudyPageContent />
    </ProtectedRoute>
  );
}
```

### Public Pages

For pages that should redirect authenticated users (like login, signup):

```typescript
// src/app/login/page.tsx
import { PublicRoute } from '@/components/auth/PublicRoute';

function LoginPageContent() {
  // Your login form here
  return <div>Login form</div>;
}

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginPageContent />
    </PublicRoute>
  );
}
```

### Components Using Authentication

For components that need user information:

```typescript
// src/components/SomeComponent.tsx
import { useAuth } from '@/hooks/useAuth';

export function SomeComponent() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      {/* Component content */}
    </div>
  );
}
```

## Authentication Flow

1. **User visits a protected page**: If not authenticated, they're redirected to `/login`
2. **User logs in**: After successful login, they're redirected to `/study`
3. **User visits a public page while authenticated**: They're redirected to `/study`
4. **User signs out**: They're redirected to the home page

## Configuration Options

### useAuth Hook Options

- `requireAuth`: Whether to redirect unauthenticated users
- `redirectTo`: Where to redirect unauthenticated users (default: `/login`)
- `redirectIfAuthenticated`: Whether to redirect authenticated users away
- `redirectAuthenticatedTo`: Where to redirect authenticated users (default: `/study`)

### ProtectedRoute Options

- `redirectTo`: Where to redirect unauthenticated users
- `loadingComponent`: Custom loading component
- `errorComponent`: Custom error component

### PublicRoute Options

- `redirectTo`: Where to redirect authenticated users
- `loadingComponent`: Custom loading component

## Best Practices

1. **Always wrap protected pages** with `ProtectedRoute`
2. **Always wrap public pages** with `PublicRoute`
3. **Use the useAuth hook** for components that need user information
4. **Handle loading states** appropriately
5. **Provide meaningful error messages** when authentication fails

## Error Handling

The authentication system automatically handles common scenarios:

- **Network errors**: Displayed to the user with retry options
- **Authentication failures**: Users are redirected to login
- **Session expiration**: Users are automatically logged out and redirected

## Security Considerations

- All protected routes are client-side protected
- Server-side authentication checks should be implemented for API routes
- Session tokens are managed securely by Supabase
- Automatic session refresh is handled by the middleware

## Troubleshooting

### Common Issues

1. **Infinite redirects**: Check that your route configuration doesn't create loops
2. **Loading never ends**: Ensure your Supabase client is properly configured
3. **Authentication state not updating**: Verify that auth state change listeners are working

### Debug Mode

To debug authentication issues, you can add logging:

```typescript
const { user, loading, error } = useAuth({
  requireAuth: true,
  redirectTo: '/login'
});

console.log('Auth state:', { user, loading, error });
```

This authentication system provides a robust, reusable solution for handling user authentication across your application while maintaining good user experience and security practices. 