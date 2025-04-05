import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

// Hero section component with animations
const Hero = () => (
  <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Master Anything with <span className="text-primary-600">Smart Flashcards</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Anki-like spaced repetition system powered by AI to help you learn faster and remember longer.
        </p>
        <Link href="/login" className="btn-primary px-8 py-3 text-lg inline-block">
          Start Learning - It's Free
        </Link>
      </div>
      <div className="mt-16 max-w-5xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-48 bg-primary-600 opacity-5 rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-xl shadow-xl p-4 border border-gray-100">
              <img 
                src="https://placehold.co/1200x600/f5f8ff/a3accc?text=Mentator+Dashboard" 
                alt="Mentator Dashboard Preview"
                className="rounded-lg w-full" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Features section
const Features = () => (
  <div className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Mentator?</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Our science-backed approach helps you remember more in less time
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            title: 'Spaced Repetition',
            description: 'Our algorithm shows you cards at optimal intervals for maximum retention',
            icon: '🔄'
          },
          {
            title: 'AI-Powered',
            description: 'Generate flashcards automatically from your notes or web content',
            icon: '🤖'
          },
          {
            title: 'Multi-Device Sync',
            description: 'Access your flashcards anywhere, anytime on all your devices',
            icon: '📱'
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Testimonials section
const Testimonials = () => (
  <div className="py-16 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Join thousands of learners who've transformed their study habits
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            quote: "Mentator helped me ace my medical exams. The spaced repetition system is a game-changer!",
            author: "Dr. Sarah Johnson",
            role: "Medical Resident"
          },
          {
            quote: "I've tried many flashcard apps, but Mentator is by far the most intuitive and effective.",
            author: "Michael Chen",
            role: "Software Engineer"
          },
          {
            quote: "The AI-generated cards save me so much time. I can focus on studying instead of creating flashcards.",
            author: "Emma Rodriguez",
            role: "Language Student"
          }
        ].map((testimonial, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="text-2xl text-gray-400 mb-4">"</div>
            <p className="text-gray-700 mb-6 italic">{testimonial.quote}</p>
            <div>
              <p className="font-semibold text-gray-900">{testimonial.author}</p>
              <p className="text-gray-500 text-sm">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// CTA section
const CTA = () => (
  <div className="py-16 bg-white">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl shadow-xl p-8 md:p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to boost your learning?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of students and professionals who use Mentator to master new skills.
        </p>
        <Link href="/login" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-md text-lg inline-block transition-colors">
          Create Your Free Account
        </Link>
      </div>
    </div>
  </div>
);

export default function Home() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (session) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Hero />
      <Features />
      <Testimonials />
      <CTA />
    </Layout>
  );
}
