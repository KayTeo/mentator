import { supabase } from '../../../lib/supabase';

// GET /api/flashcards/[id] - Get a specific flashcard
// PUT /api/flashcards/[id] - Update a flashcard
// DELETE /api/flashcards/[id] - Delete a flashcard
export default async function handler(req, res) {
  // Get the user's session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { id } = req.query;

  // Verify the flashcard belongs to the user
  const { data: cardData, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .single();

  if (cardError || !cardData) {
    return res.status(404).json({ error: 'Flashcard not found' });
  }

  if (cardData.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  switch (req.method) {
    case 'GET':
      return res.status(200).json(cardData);

    case 'PUT':
      try {
        const { front, back, difficulty } = req.body;
        const updates = {};

        // Only update fields that are provided
        if (front !== undefined) updates.front = front;
        if (back !== undefined) updates.back = back;
        if (difficulty !== undefined) updates.difficulty = difficulty;

        const { data, error } = await supabase
          .from('cards')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json(data);
      } catch (error) {
        console.error('Error updating flashcard:', error);
        return res.status(500).json({ error: 'Error updating flashcard' });
      }

    case 'DELETE':
      try {
        const { error } = await supabase
          .from('cards')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Update deck's card count
        await supabase.rpc('decrement_deck_card_count', {
          deck_id: cardData.deck_id
        });

        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting flashcard:', error);
        return res.status(500).json({ error: 'Error deleting flashcard' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 