import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const supabase = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    // Redirect to Google OAuth sign-in
    const signIn = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            prompt: 'select_account', // Force account selection even if already signed in
          },
        },
      });
      
      if (error) {
        console.error('OAuth sign in error:', error);
        router.push('/');
      }
    };
    
    signIn();
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Google login...</h1>
        <p className="text-gray-600">You'll be redirected to the dashboard after successful authentication.</p>
      </div>
    </div>
  );
}
