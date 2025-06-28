'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { useChat } from '@ai-sdk/react';
import { createClient } from '@/utils/supabase/client';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Database } from '@/types/database';
import { learning_algorithm } from '@/lib/learning_algorithm';

export function ChatbotStudy() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [datasets, setDatasets] = useState<Database['public']['Tables']['datasets']['Row'][]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [currentCard, setCurrentCard] = useState<Database['public']['Tables']['data_points']['Row'] | null>(null);
  const [cardSet, setCardSet] = useState<Database['public']['Tables']['data_points']['Row'][]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const lastAddedQuestionRef = useRef<number>(-1); // Track last question added to chat
  const [chat_state, setChatState] = useState<string>('asking');
  const supabase = createClient();

  // On mount, try to load persisted dataset
  useEffect(() => {
    const saved = localStorage.getItem('selectedDataset');
    if (saved) setSelectedDataset(saved);
  }, []);

  useEffect(() => {
    const fetchDatasets = async () => {
      setLoadingDatasets(true);
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setDatasets(data);
        // If no dataset is selected, pick the first one (or persisted one)
        if (!selectedDataset && data.length > 0) {
          const saved = localStorage.getItem('selectedDataset');
          setSelectedDataset(saved && data.some(ds => ds.id === saved) ? saved : data[0].id);
        }
      }
      setLoadingDatasets(false);
    };
    fetchDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Persist selection
  // Retrieve cards from dataset that need reviewing
  useEffect(() => {
    const fetchDueCards = async () => {
      if (!selectedDataset) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No authenticated user');
        }

        // Query dataset_data_points and join with data_points to get actual content
        const { data, error } = await supabase
          .from('dataset_data_points')
          .select(`
            data_point_id,
            data_points (
              id,
              user_id,
              content,
              label,
              created_at,
              updated_at,
              metadata
            )
          `)
          .eq('dataset_id', selectedDataset);

        if (error) {
          throw new Error('Failed to fetch due cards');
        }

        if (data) {
          // Extract the data_points from the joined result and flatten
          const dataPoints = data
            .map(row => row.data_points)
            .flat()
            .filter(point => point !== null) as Database['public']['Tables']['data_points']['Row'][];
          const processedCards = learning_algorithm(dataPoints);
          setCardSet(processedCards);
          // Reset to first question when dataset changes
          setCurrentQuestionIndex(0);
          if (dataPoints.length > 0) {
            setCurrentCard(dataPoints[0]);
            setIsWaitingForAnswer(true);
          }
        }
      } catch (error) {
        console.error('Error fetching due cards:', error);
      }
    };

    fetchDueCards();
  }, [selectedDataset, supabase]);

  // Update current card when question index changes
  useEffect(() => {
    if (cardSet.length > 0 && currentQuestionIndex < cardSet.length) {
      setCurrentCard(cardSet[currentQuestionIndex]);
      setIsWaitingForAnswer(true);
    }
  }, [cardSet, currentQuestionIndex]);

  // TODO: Put message as context when accessing chat api
  useEffect(() => {
    if (selectedDataset) {
      localStorage.setItem('selectedDataset', selectedDataset);
    }
  }, [selectedDataset]);

  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading, error, append } = useChat({
    api: '/api/chat',
    body: {
      dataset_id: selectedDataset,
      chat_state: chat_state,
      content: currentCard ? currentCard.content : '',
      card_context: currentCard ? `Content: ${currentCard.content}\nLabel: ${currentCard.label}` : '',
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI tutor. I\'m here to help you study and understand the material. What would you like to learn about today?'
      }
    ],
    key: `${selectedDataset}-${currentQuestionIndex}` // Force reset when dataset or question changes
  });

  // Add question to chat when current card changes (after useChat is defined)
  useEffect(() => {
    console.log('Send new question', currentCard, isWaitingForAnswer, lastAddedQuestionRef.current, currentQuestionIndex)
    if (currentCard && isWaitingForAnswer && lastAddedQuestionRef.current !== currentQuestionIndex) {
      append({
        role: 'assistant',
        content: `**Question ${currentQuestionIndex + 1}:**\n\n${currentCard.content}`
      });
      lastAddedQuestionRef.current = currentQuestionIndex;
    }
  }, [currentCard, currentQuestionIndex, append, isWaitingForAnswer]);

  // Function to grade user's answer
  const gradeUserAnswer = async (userAnswer: string) => {
    if (!currentCard) return;

    try {
      await append({
        role: 'user',
        content: `Grade this answer: ${userAnswer}`
      });
      
      // The API will handle the grading based on the context
    } catch (error) {
      console.error('Error grading answer:', error);
    }
  };

  // Function to move to next question
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < cardSet.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setInput(''); // Clear input for next question
    } else {
      // All questions completed
      setIsWaitingForAnswer(false);
      append({
        role: 'assistant',
        content: '🎉 Congratulations! You have completed all questions in this dataset. Great job!'
      });
    }
  };

  async function handleSubmitWrapper(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userAnswer = formData.get('user_answer') as string;
    
    if (userAnswer.trim() && currentCard) {
      setInput(userAnswer);
      
      // Add user's answer to the chat
      await append({
        role: 'user',
        content: userAnswer
      });

      // Grade the answer
      await gradeUserAnswer(userAnswer);
      
      // Move to next question after a short delay
      setTimeout(() => {
        moveToNextQuestion();
      }, 2000);
    }
  }

  // Function to start a new question session
  const startNewSession = () => {
    setCurrentQuestionIndex(0);
    setIsWaitingForAnswer(true);
    setInput(''); // Clear input
    lastAddedQuestionRef.current = -1; // Reset the ref so questions can be added again
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">AI-Powered Study Assessment</h2>
      <div className="flex flex-col gap-4">
        <div className="w-full max-w-xs mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Dataset</label>
          <Select
            value={selectedDataset}
            onValueChange={setSelectedDataset}
            disabled={loadingDatasets || datasets.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  loadingDatasets
                    ? 'Loading datasets...'
                    : datasets.length === 0
                      ? 'No datasets found'
                      : 'Select a dataset'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {datasets.map(ds => (
                <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(!loadingDatasets && datasets.length === 0) && (
            <p className="text-sm text-red-500 mt-2">No datasets found. Please create a dataset to start studying.</p>
          )}
        </div>

        {/* Progress indicator */}
        {cardSet.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-green-800">Progress</h3>
              <span className="text-sm text-green-600">
                {currentQuestionIndex + 1} of {cardSet.length}
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / cardSet.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Current Question Display */}
        {currentCard && isWaitingForAnswer && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Question {currentQuestionIndex + 1}:</h3>
            <div className="text-sm text-blue-700">
              <p className="font-medium">{currentCard.content}</p>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="border rounded-lg p-4 min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500">Start answering questions to see your progress!</p>
            ) : (
              messages.map((msg, idx) => (
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

          {/* Session Controls */}
          {!isWaitingForAnswer && cardSet.length > 0 && (
            <div className="flex gap-2 mt-auto">
              <Button
                onClick={startNewSession}
                variant="secondary"
                className="flex-1"
              >
                Start New Session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 