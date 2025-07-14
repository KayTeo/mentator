'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Database } from '@/types/database';
import { fetchDueCards, fetchDatasets, updateCardLoss } from '@/utils/assorted/helper';
import { ChatbotInterface } from '@/components/study/ChatbotInterface';

export function ChatbotStudy() {
  const [datasets, setDatasets] = useState<Database['public']['Tables']['datasets']['Row'][]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [currentCard, setCurrentCard] = useState<Database['public']['Tables']['data_points']['Row'] | null>(null);
  const [cardSet, setCardSet] = useState<Database['public']['Tables']['data_points']['Row'][]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const supabase = createClient();

  // On mount, try to load persisted dataset
  useEffect(() => {
    const saved = localStorage.getItem('selectedDataset');
    if (saved) setSelectedDataset(saved);
  }, []);

  useEffect(() => {
    const loadDatasets = async () => {
      setLoadingDatasets(true);
      try {
        const data = await fetchDatasets(supabase);
        setDatasets(data);
        // If no dataset is selected, pick the first one (or persisted one)
        if (!selectedDataset && data.length > 0) {
          const saved = localStorage.getItem('selectedDataset');
          setSelectedDataset(saved && data.some(ds => ds.id === saved) ? saved : data[0].id);
        }
      } catch (error) {
        console.error('Error loading datasets:', error);
      }
      setLoadingDatasets(false);
    };
    loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Retrieve cards from dataset that need reviewing
  useEffect(() => {
    const loadDueCards = async () => {
      if (!selectedDataset) return;

      try {
        const processedCards = await fetchDueCards(selectedDataset, supabase);
        console.log("Processed cards", processedCards);
        setCardSet(processedCards);
        // Reset to first question when dataset changes
        setCurrentQuestionIndex(0);
        if (processedCards.length > 0) {
          setCurrentCard(processedCards[0]);
          setIsWaitingForAnswer(true);
        }
      } catch (error) {
        console.error('Error fetching due cards:', error);
      }
    };

    loadDueCards();
  }, [selectedDataset, supabase]);

  // Update current card when question index changes
  useEffect(() => {
    if (cardSet.length > 0 && currentQuestionIndex < cardSet.length) {
      setCurrentCard(cardSet[currentQuestionIndex]);
      setIsWaitingForAnswer(true);
    }
  }, [cardSet, currentQuestionIndex]);

  // Function to move to next question
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < cardSet.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions completed
      setIsWaitingForAnswer(false);
    }
  };

  /**
   * Handles answer submission from the chatbot interface
   * @param userAnswer - The user's submitted answer
   */
  async function handleAnswerSubmit(userAnswer: string) {
    if (!currentCard) return;
    
    setIsGrading(true);
    
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
          content: currentCard.content,
          userAnswer: userAnswer
        }),
      });
      
      const gradeData = await gradeResponse.json();
      console.log("Grade is " + gradeData.message);
      await updateCardLoss(gradeData.message, userAnswer, currentCard, supabase);
      
      // Move to next question
      moveToNextQuestion();
    } catch (error) {
      console.error('Error grading answer:', error);
    } finally {
      setIsGrading(false);
    }
  }

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
        <ChatbotInterface
          datasetId={selectedDataset}
          currentCard={currentCard}
          isWaitingForAnswer={isWaitingForAnswer}
          currentQuestionIndex={currentQuestionIndex}
          onAnswerSubmit={handleAnswerSubmit}
          isLoading={isGrading}
        />
      </div>
    </div>
  );
} 