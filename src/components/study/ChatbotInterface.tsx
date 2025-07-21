'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { useChat } from '@ai-sdk/react';
import { Database } from '@/types/database';
import { fetchDueCards, updateCardLoss } from '@/utils/assorted/helper';
import { createClient } from '@/utils/supabase/client';

interface ChatbotInterfaceProps {
  /** The current dataset ID being studied */
  datasetId: string;
}

/**
 * A reusable chatbot interface component for study sessions
 * 
 * This component handles the chat UI and interaction logic, including:
 * - Displaying questions and user responses
 * - Managing chat state and message history
 * - Handling user input and submission
 * 
 * The component is designed to be controlled by its parent, which manages
 * the overall study session state and card progression.
 */
export function ChatbotInterface({
  datasetId,
}: ChatbotInterfaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatState, setChatState] = useState<string>('asking');
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);

  const [cards, setCards] = useState<Database['public']['Tables']['data_points']['Row'][]>([]);
  const [currentCard, setCurrentCard] = useState<Database['public']['Tables']['data_points']['Row'] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const supabase = createClient();

  // Initialize chat object
  const { messages, input, handleInputChange, setInput, isLoading: chatLoading, error, append } = useChat({
    api: '/api/chat',
    body: {
      dataset_id: datasetId,
      chat_state: chatState,
      content: currentCard ? currentCard.content : '',
      card_context: currentCard ? `Content: ${currentCard.content}\nLabel: ${currentCard.label}` : '',
    },
    key: `${datasetId}` // Only reset when dataset changes, not on every question
  });

  // Initial load of cards
  useEffect(() => {
    console.log("Dataset ID", datasetId);
    const loadCards = async () => {

      if (!datasetId) {
        endStudy();
        return;
      }

      const cardsHolder = await fetchDueCards(datasetId, supabase);
      console.log("Cards holder", cardsHolder);
      if (cardsHolder.length <= 0) {
        console.log("No cards found");
        endStudy();
        return;
      }
      append({
        role: 'assistant',
        content: cardsHolder[0].content
      })
      setCurrentCard(cardsHolder[0]);
      setCards(cardsHolder);
      
      setChatState('asking');
    }
    loadCards();
  }, [datasetId, supabase, append]);


  async function endStudy() {
    setCurrentCard(null);
    setCurrentQuestionIndex(0);
    setChatState('asking');
  }

  /**
   * Handles form submission for user answers
   * @param e - The form submission event
   */
  async function handleSubmitWrapper(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userAnswer = formData.get('user_answer') as string;
    setIsWaitingForAnswer(true);
    
    if (userAnswer.trim() && currentCard) {
      setInput(userAnswer);

      // Add user's answer to the chat
      setChatState('grading');
      await append({
        role: 'user',
        content: `${userAnswer}`
      });
      
      // Clear input for next question
      setInput('');
    }

    if (!currentCard) return;
    
    try {
      // Start the grade API call
      const gradeResponse = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: userAnswer,
          chat_state: 'grading',
          card_context: currentCard.content,
          content: currentCard.label,
          userAnswer: userAnswer
        }),
      });
      
      const gradeData = await gradeResponse.json();
      console.log("Grade is " + gradeData.message);
      await updateCardLoss(gradeData.message, userAnswer, currentCard, supabase);
    } catch (error) {
      console.error('Error grading answer:', error);
    }

    // Transition to next question
    if (currentQuestionIndex < cards.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentCard(cards[currentQuestionIndex]);

      append({
        role: 'assistant',
        content: currentCard.content
      })
    } else {

      endStudy()

    }

    setIsWaitingForAnswer(false);


  }

  const isLoading = chatLoading;

  return (
    <div className="border rounded-lg p-4 min-h-[400px] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">Start answering questions to see your progress!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <span className={
                msg.role === 'user'
                  ? 'inline-block bg-blue-100 text-blue-800 rounded-lg px-3 py-2 max-w-[80%]'
                  : 'inline-block bg-gray-200 text-gray-800 rounded-lg px-3 py-2 max-w-[80%]'
              }>
                {msg.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return <span key={`${msg.id}-${i}`}>{part.text}</span>;
                  }
                  return null;
                })}
              </span>
            </div>
          ))
        )}
        {error && <div className="text-center text-red-500 text-sm">{error.message || String(error)}</div>}
      </div>
      
      {/* Answer Input */}
      {!isWaitingForAnswer && currentCard && (
        <form className="flex gap-2 mt-auto" onSubmit={handleSubmitWrapper}>
          <input
            ref={inputRef}
            type="text"
            name="user_answer"
            className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            placeholder="Type your answer here..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            autoComplete="off"
            autoFocus
          />
          <Button
            disabled={isLoading || !input.trim()}
            variant="primary"
            type="submit"
          >
            {isLoading ? 'Grading...' : 'Submit Answer'}
          </Button>
        </form>
      )}
    </div>
  );
} 