'use client'

import { useSearchParams } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { PublicRoute } from '@/components/auth/PublicRoute'

/**
 * Login page component
 * 
 * This page is public and should redirect authenticated users to the dashboard.
 */
function LoginPageContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <LoginForm message={message} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginPageContent />
    </PublicRoute>
  )
} 