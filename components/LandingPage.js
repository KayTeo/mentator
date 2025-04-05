import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Mentator</h1>
          <Link href="/login" className="btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Anything with <span className="text-primary-600">Smart Flashcards</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Anki-like spaced repetition system powered by AI to help you learn faster and remember longer.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="btn-primary px-8 py-3 text-lg">
              Start Learning - It's Free
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
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
            <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to boost your learning?</h2>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of students and professionals who use Mentator to master new skills.
          </p>
          <Link href="/login" className="btn-primary px-8 py-3 text-lg inline-block">
            Create Your Free Account
          </Link>
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>© {new Date().getFullYear()} Mentator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
