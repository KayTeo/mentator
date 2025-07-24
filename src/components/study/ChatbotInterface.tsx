'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { useChat } from '@ai-sdk/react';
import { Database } from '@/types/database';
import { fetchDueCards, updateCardLoss } from '@/utils/assorted/helper';
import { createClient } from '@/utils/supabase/client';
import { MemoizedMarkdown } from './memoized-markdown';
import { UIMessage } from 'ai';
import { LatexInputField } from './LatexInputField';

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [cards, setCards] = useState<Database['public']['Tables']['data_points']['Row'][]>([]);
  const [currentCard, setCurrentCard] = useState<Database['public']['Tables']['data_points']['Row'] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const supabase = createClient();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [waitingForGrade, setWaitingForGrade] = useState(false);
  const [lastUserAnswer, setLastUserAnswer] = useState('');
  const [studyComplete, setStudyComplete] = useState(false);

  // Initialize chat object
  const { messages, input, handleInputChange, isLoading: chatLoading, error, append } = useChat({
    api: '/api/chat',
    body: {
      dataset_id: datasetId,
      content: currentCard ? currentCard.content : '',
      card_context: currentCard ? `Content: ${currentCard.content}\nLabel: ${currentCard.label}` : '',
    },
    key: `${datasetId}` // Only reset when dataset changes, not on every question
  });

  // Initial load of cards
  useEffect(() => {
    const loadCards = async () => {

      // This seems to be triggering 2 times per new load. Not breaking but annoying.
      if (!datasetId) {
        console.log("No dataset ID");
        return;
      }

      const cardsHolder = await fetchDueCards(datasetId, supabase);
      if (cardsHolder.length <= 0) {
        console.log("No cards found");
        endStudy();
        return;
      }
      append({
        role: 'assistant',
        content: cardsHolder[0].content
      },
      {
        body: {
          chat_state: 'asking'
        }
      })
      setCurrentCard(cardsHolder[0]);
      setCards(cardsHolder);
      setStudyComplete(false);
    }
    loadCards();
  }, [datasetId, supabase, append]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  useEffect(() => {
    if (submitted) {
      inputRef.current?.focus();
      setSubmitted(false); // Reset for next submit
    }
  }, [submitted]);

  useEffect(() => {
    if (!waitingForGrade) return;

    // Find the last assistant message after the user's answer
    const lastGrade = getLastLLMGrade(messages);
    console.log("Last grade is " + lastGrade);
    console.log("Current card is " + currentCard);
    if (lastGrade && currentCard) {
      console.log("Updating card loss in grading thing");
      // You may want to also store the last user answer in state to use here
      updateCardLoss(lastGrade, lastUserAnswer, currentCard, supabase);
      setWaitingForGrade(false);

      // Transition to next question, etc.
      // ... (move to next card, reset input, etc.)
    }
  }, [messages, waitingForGrade]);


  function endStudy() {
    console.log("Ending study");
    // setCurrentCard(null);
    setCurrentQuestionIndex(0);
    setCards([]);
    setStudyComplete(true);
  }

  /**
   * Handles form submission for user answers
   * @param e - The form submission event
   */
  async function handleSubmitWrapper(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // Insert $$ so katex will render the latex
    const userAnswer = `$$${formData.get('user_answer') as string}$$`;
    setIsWaitingForAnswer(true);
    
    if (userAnswer.trim() && currentCard) {

      // Add user's answer to the chat
      await append({
        role: 'user',
        content: `${userAnswer}`
      },
      {
        body: {
          chat_state: 'grading',
          card_context: currentCard.content
        }
      }
    );
      
    }

    if (!currentCard) return;
    
    setLastUserAnswer(userAnswer);
    setWaitingForGrade(true);

    // Transition to next question
    if (currentQuestionIndex < cards.length - 1) {

      append({
        role: 'assistant',
        content: cards[currentQuestionIndex + 1].content
      },
      {
        body: {
          chat_state: 'asking'
        }
      })
      
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentCard(cards[currentQuestionIndex]);
    } else {
      console.log("Ending submit study")
      endStudy()
    }
    setIsWaitingForAnswer(false);
    setSubmitted(true);
  }

  const isLoading = chatLoading;

  function getLastLLMGrade(messages: UIMessage[]) {
    // 1. Find the last assistant message
    const lastAssistantMsg = [...messages].reverse().find(msg => msg.role === 'assistant');
    if (!lastAssistantMsg) return null;

    // 2. Concatenate all text parts
    const fullText = lastAssistantMsg.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');

    // 3. Extract the last "Grade: ..." line (case-insensitive, trims whitespace)
    const gradeMatch = fullText.match(/Grade:\s*([A-F][+-]?)/i);
    if (gradeMatch) {
      return gradeMatch[1].trim();
    }

    // Fallback: get the last non-empty line
    const lines = fullText.trim().split('\n').filter(Boolean);
    return lines.length > 0 ? lines[lines.length - 1] : null;
  }

  return (
    <div className="border rounded-lg p-4 min-h-[400px] flex flex-col">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4">
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
                    return (
                      <MemoizedMarkdown
                        key={`${msg.id}-${i}`}
                        content={part.text}
                        id={`${msg.id}-${i}`}
                      />
                    );
                  }
                  return null;
                })}
              </span>
            </div>
          ))
        )}
        {error && <div className="text-center text-red-500 text-sm">{error.message || String(error)}</div>}
        <div ref={endOfMessagesRef} />
      </div>
      {/* Answer Input */}
      {(
        <form ref={formRef} className="flex gap-2 mt-auto" onSubmit={handleSubmitWrapper}>
          <LatexInputField
            value={input}
            onChange={handleInputChange}
            name="user_answer"
            autoComplete="off"
            autoFocus
            className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 resize-y min-h-[48px] max-h-40"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
          <Button
            disabled={isLoading || !input.trim() || isWaitingForAnswer}
            variant="primary"
            type="submit"
          >
            {isLoading ? 'Grading...' : isWaitingForAnswer ? 'Waiting...' : 'Submit Answer'}
          </Button>
        </form>
      )}
      {studyComplete && <div className="text-center text-green-600">Session complete! Well done!</div>}
    </div>
  );
} 