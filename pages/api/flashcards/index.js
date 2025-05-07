import { supabase } from '../../../lib/supabase';

// GET /api/flashcards - Get all flashcards for a user
// POST /api/flashcards - Create a new flashcard
export default async function handler(req, res) {
  // Get the user's session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        return res.status(500).json({ error: 'Error fetching flashcards' });
      }

    case 'POST':
      try {
        const { front, back, deck_id } = req.body;

        // Validate required fields
        if (!front || !back || !deck_id) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
          .from('cards')
          .insert([{
            user_id: userId,
            deck_id,
            front,
            back,
            difficulty: 'medium',
            next_review: new Date().toISOString()
          }])
          .select();

        if (error) throw error;

        // Update deck's card count
        await supabase.rpc('increment_deck_card_count', {
          deck_id
        });

        return res.status(201).json(data[0]);
      } catch (error) {
        console.error('Error creating flashcard:', error);
        return res.status(500).json({ error: 'Error creating flashcard' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 