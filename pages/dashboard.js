import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import CreateDeckModal from '../components/CreateDeckModal';
import { getDecks } from '../lib/db';

export default function Dashboard() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCards: 0,
    cardsToReview: 0,
    newCards: 0
  });

  // Fetch user's decks
  useEffect(() => {
    if (!session) {
      router.push('/');
    } else {
      const fetchDecks = async () => {
        try {
          setIsLoading(true);
          const userId = session.user.id;
          const userDecks = await getDecks(userId);
          setDecks(userDecks);
          
          // Calculate stats based on decks
          const totalCards = userDecks.reduce((sum, deck) => sum + deck.card_count, 0);
          
          // For demo purposes, we'll set some placeholder values
          // In a real app, you would calculate these based on spaced repetition algorithm
          setStats({
            totalCards,
            cardsToReview: Math.floor(totalCards * 0.2), // 20% of cards due for review
            newCards: Math.floor(totalCards * 0.1)  // 10% new cards
          });
        } catch (error) {
          console.error('Error fetching decks:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchDecks();
    }
  }, [session, router]);

  const handleDeckCreated = (newDeck) => {
    setDecks([newDeck, ...decks]);
    
    // Update stats
    setStats(prevStats => ({
      ...prevStats,
      totalCards: prevStats.totalCards + newDeck.card_count
    }));
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your flashcards and track your progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-1">Total Cards</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.totalCards}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-1">Due for Review</h3>
            <p className="text-3xl font-bold text-secondary-600">{stats.cardsToReview}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-1">New Cards</h3>
            <p className="text-3xl font-bold text-green-600">{stats.newCards}</p>
          </div>
        </div>

        {/* Decks */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Decks</h2>
            <button 
              className="btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create New Deck
            </button>
          </div>
          
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your decks...</p>
            </div>
          ) : decks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Decks Yet</h3>
              <p className="text-gray-600 mb-4">Create your first deck to start learning</p>
              <button 
                className="btn-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Your First Deck
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cards</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {decks.map((deck) => (
                    <tr key={deck.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{deck.name}</div>
                        {deck.description && (
                          <div className="text-sm text-gray-500">{deck.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {deck.card_count} cards
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(deck.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          onClick={() => router.push(`/decks/${deck.id}`)}
                        >
                          Study
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900 mr-3"
                          onClick={() => router.push(`/decks/${deck.id}/edit`)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Study Reminder */}
        {stats.cardsToReview > 0 && (
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg shadow p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Ready to study?</h3>
            <p className="mb-4">You have {stats.cardsToReview} cards due for review today.</p>
            <button className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-2 px-4 rounded-md transition-colors">
              Start Review Session
            </button>
          </div>
        )}
      </div>

      {/* Create Deck Modal */}
      <CreateDeckModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDeckCreated={handleDeckCreated}
      />
    </Layout>
  );
}
