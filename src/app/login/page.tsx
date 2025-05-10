'use client'

import { useSearchParams } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <LoginForm message={message} />
    </div>
  )
} 