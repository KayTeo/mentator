'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { useChat } from '@ai-sdk/react';
import { Database } from '@/types/database';

interface ChatbotInterfaceProps {
  /** The current dataset ID being studied */
  datasetId: string;
  /** The current card being studied */
  currentCard: Database['public']['Tables']['data_points']['Row'] | null;
  /** Whether we're waiting for the user to answer */
  isWaitingForAnswer: boolean;
  /** Current question index for tracking progress */
  currentQuestionIndex: number;
  /** Callback when user submits an answer */
  onAnswerSubmit: (answer: string) => Promise<void>;
  /** Whether the chat is currently loading */
  isLoading?: boolean;
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
  currentCard,
  isWaitingForAnswer,
  currentQuestionIndex,
  onAnswerSubmit,
  isLoading: externalLoading = false
}: ChatbotInterfaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAddedQuestionRef = useRef<number>(-1);
  const [chatState, setChatState] = useState<string>('asking');

  // Initialize chat object
  const { messages, input, handleInputChange, setInput, isLoading: chatLoading, error, append } = useChat({
    api: '/api/chat',
    body: {
      dataset_id: datasetId,
      chat_state: chatState,
      content: currentCard ? currentCard.content : '',
      card_context: currentCard ? `Content: ${currentCard.content}\nLabel: ${currentCard.label}` : '',
    },
    key: `${datasetId}-${currentQuestionIndex}` // Force reset when dataset or question changes
  });

  // Add question to chat when current card changes
  useEffect(() => {
    console.log('Send new question', currentCard, isWaitingForAnswer, lastAddedQuestionRef.current, currentQuestionIndex);
    setChatState('asking');
    if (currentCard && isWaitingForAnswer && lastAddedQuestionRef.current !== currentQuestionIndex) {
      append({
        role: 'assistant',
        content: `**Question ${currentQuestionIndex + 1}:**\n\n${currentCard.content}`
      });
      lastAddedQuestionRef.current = currentQuestionIndex;
    } else if (!isWaitingForAnswer && lastAddedQuestionRef.current !== -1) {
      // Show completion message when study session is done
      append({
        role: 'assistant',
        content: '🎉 Congratulations! You have completed all questions in this dataset. Great job!'
      });
      lastAddedQuestionRef.current = -1;
    }
  }, [currentCard, currentQuestionIndex, append, isWaitingForAnswer]);

  /**
   * Handles form submission for user answers
   * @param e - The form submission event
   */
  async function handleSubmitWrapper(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userAnswer = formData.get('user_answer') as string;
    
    if (userAnswer.trim() && currentCard) {
      setInput(userAnswer);

      // Add user's answer to the chat
      setChatState('grading');
      await append({
        role: 'user',
        content: `${userAnswer}`
      });

      // Call parent's answer submission handler
      await onAnswerSubmit(userAnswer);
      
      // Clear input for next question
      setInput('');
    }
  }

  const isLoading = chatLoading || externalLoading;

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
      {isWaitingForAnswer && currentCard && (
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