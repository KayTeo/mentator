'use client'

import SignUpForm from '@/components/auth/SignUpForm'
import { PublicRoute } from '@/components/auth/PublicRoute'

/**
 * Signup page component
 * 
 * This page is public and should redirect authenticated users to the dashboard.
 */
function SignUpPageContent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <SignUpForm />
    </div>
  )
}

export default function SignUpPage() {
  return (
    <PublicRoute>
      <SignUpPageContent />
    </PublicRoute>
  )
} 