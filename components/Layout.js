import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-3xl">📚</span>
                <span className="text-2xl font-bold text-primary-600">Mentator</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              {session ? (
                <>
                  <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/decks" className="text-gray-600 hover:text-primary-600 transition-colors">
                    My Decks
                  </Link>
                  <Link href="/cards/add" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Add Cards
                  </Link>
                  <Link href="/study" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Study
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/features" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Features
                  </Link>
                  <Link href="/pricing" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Pricing
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-3">
              {session ? (
                <>
                  <div className="hidden md:flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      {session.user.email.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600">{session.user.email}</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="btn-secondary text-sm"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" className="btn-primary">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Mentator</h3>
              <p className="text-gray-600 mb-4">The smart flashcard learning platform that helps you remember everything.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-600 hover:text-primary-600 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-primary-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/blog" className="text-gray-600 hover:text-primary-600 transition-colors">Blog</Link></li>
                <li><Link href="/support" className="text-gray-600 hover:text-primary-600 transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-600 hover:text-primary-600 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-primary-600 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Mentator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
