import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function FlashcardManager() {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCard, setNewCard] = useState({ front: '', back: '', deck_id: '' });
  const supabase = useSupabaseClient();

  // Fetch flashcards
  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flashcards');
      if (!response.ok) throw new Error('Failed to fetch flashcards');
      const data = await response.json();
      setFlashcards(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new flashcard
  const createFlashcard = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCard),
      });

      if (!response.ok) throw new Error('Failed to create flashcard');
      
      const createdCard = await response.json();
      setFlashcards([createdCard, ...flashcards]);
      setNewCard({ front: '', back: '', deck_id: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  // Update flashcard
  const updateFlashcard = async (id, updates) => {
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update flashcard');
      
      const updatedCard = await response.json();
      setFlashcards(flashcards.map(card => 
        card.id === id ? updatedCard : card
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete flashcard
  const deleteFlashcard = async (id) => {
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete flashcard');
      
      setFlashcards(flashcards.filter(card => card.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, []);

  if (loading) return <div>Loading flashcards...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Create new flashcard form */}
      <form onSubmit={createFlashcard} className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Create New Flashcard</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Front</label>
            <input
              type="text"
              value={newCard.front}
              onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Back</label>
            <input
              type="text"
              value={newCard.back}
              onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deck ID</label>
            <input
              type="text"
              value={newCard.deck_id}
              onChange={(e) => setNewCard({ ...newCard, deck_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Create Flashcard
          </button>
        </div>
      </form>

      {/* Flashcards list */}
      <div className="space-y-4">
        {flashcards.map((card) => (
          <div key={card.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Front: {card.front}</h3>
                <p className="text-gray-600">Back: {card.back}</p>
                <p className="text-sm text-gray-500">Difficulty: {card.difficulty}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => updateFlashcard(card.id, { difficulty: 'easy' })}
                  className="text-green-600 hover:text-green-800"
                >
                  Mark Easy
                </button>
                <button
                  onClick={() => deleteFlashcard(card.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 