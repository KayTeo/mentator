import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getDecks, createCard } from '../../lib/db';

export default function AddCard() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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
          
          // If there are decks, select the first one by default
          if (userDecks.length > 0) {
            setSelectedDeckId(userDecks[0].id);
          }
        } catch (error) {
          console.error('Error fetching decks:', error);
          setError('Failed to load decks. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchDecks();
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedDeckId) {
      setError('Please select a deck');
      return;
    }
    
    if (!front.trim()) {
      setError('Front side content is required');
      return;
    }
    
    if (!back.trim()) {
      setError('Back side content is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await createCard({
        deckId: selectedDeckId,
        front: front.trim(),
        back: back.trim()
      });
      
      // Reset form
      setFront('');
      setBack('');
      
      // Show success message
      setSuccessMessage('Card created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error creating card:', err);
      setError('Failed to create card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    // Clear the form for creating another card
    setFront('');
    setBack('');
    setSuccessMessage('');
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Card</h1>
          <p className="text-gray-600">Create a new flashcard to add to your decks</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your decks...</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Decks Available</h3>
            <p className="text-gray-600 mb-4">You need to create a deck before adding cards</p>
            <button 
              className="btn-primary"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">{successMessage}</p>
                  <p className="text-sm mt-1">Your card has been added to the selected deck.</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleCreateAnother}
                    className="px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50"
                  >
                    Add Another
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="deck" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Deck*
                </label>
                <select
                  id="deck"
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name} ({deck.card_count} cards)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="front" className="block text-sm font-medium text-gray-700 mb-1">
                  Front Side*
                </label>
                <textarea
                  id="front"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter the question or prompt"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="back" className="block text-sm font-medium text-gray-700 mb-1">
                  Back Side*
                </label>
                <textarea
                  id="back"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter the answer or explanation"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Card Preview */}
        {front || back ? (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Card Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-2 border-primary-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Front</h3>
                <div className="min-h-[150px] whitespace-pre-wrap">
                  {front || <span className="text-gray-400 italic">Front side content will appear here</span>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-2 border-secondary-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Back</h3>
                <div className="min-h-[150px] whitespace-pre-wrap">
                  {back || <span className="text-gray-400 italic">Back side content will appear here</span>}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
