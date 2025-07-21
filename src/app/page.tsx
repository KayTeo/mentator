'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import SignUpForm from '@/components/auth/SignUpForm'
import { createClient } from '@/utils/supabase/client'

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/study')
      }
    }

    checkUser()
  }, [router])

  return (
    <div className="flex min-h-screen">
      {/* Left side - Content */}
      <div className="hidden w-1/2 bg-indigo-600 lg:flex lg:flex-col lg:justify-center lg:px-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Welcome to Mentator
          </h1>
          <p className="mt-6 text-lg leading-8 text-indigo-200">
            Your platform for connecting mentors and mentees. Share knowledge, grow together, and build meaningful relationships in your professional journey.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <a
              href="#features"
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Learn more
            </a>
            <a href="#contact" className="text-sm font-semibold leading-6 text-white">
              Contact us <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                isLogin
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                !isLogin
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {isLogin ? (
            <LoginForm className="mt-8" />
          ) : (
            <SignUpForm className="mt-8" />
          )}
        </div>
      </div>
    </div>
  )
} 