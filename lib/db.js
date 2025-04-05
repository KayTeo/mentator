import { supabase } from './supabase';

// Deck operations
export const getDecks = async (userId) => {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createDeck = async ({ userId, name, description }) => {
  const { data, error } = await supabase
    .from('decks')
    .insert([{ 
      user_id: userId, 
      name, 
      description,
      card_count: 0 
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteDeck = async (deckId) => {
  // First delete all cards in the deck
  await supabase
    .from('cards')
    .delete()
    .eq('deck_id', deckId);
    
  // Then delete the deck
  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);

  if (error) throw error;
};

// Card operations
export const getCards = async (deckId) => {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const createCard = async ({ deckId, front, back }) => {
  const { data, error } = await supabase
    .from('cards')
    .insert([{ 
      deck_id: deckId, 
      front, 
      back,
      difficulty: 'medium',
      next_review: new Date().toISOString() 
    }])
    .select();

  if (error) throw error;
  
  // Update deck's card count
  await supabase.rpc('increment_deck_card_count', {
    deck_id: deckId
  });
  
  return data[0];
};

export const updateCard = async (cardId, updates) => {
  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', cardId)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteCard = async (cardId) => {
  // First get the deck_id to update card count
  const { data: cardData } = await supabase
    .from('cards')
    .select('deck_id')
    .eq('id', cardId)
    .single();
    
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
  
  // Update deck's card count
  if (cardData?.deck_id) {
    await supabase.rpc('decrement_deck_card_count', {
      deck_id: cardData.deck_id
    });
  }
};
