'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Database } from '@/types/database';
import { fetchDueCards, fetchDatasets } from '@/utils/assorted/helper';
import { useAuth } from '@/hooks/useAuth';

type DataPoint = Database['public']['Tables']['data_points']['Row'];
type Dataset = Database['public']['Tables']['datasets']['Row'];

// Create Supabase client once outside component to prevent re-creation on every render
const supabase = createClient();

/**
 * Normal study mode component
 * 
 * This component provides a traditional flashcard-style study experience
 * where users can reveal answers and mark their confidence levels.
 */
export function NormalStudy() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch available datasets
  useEffect(() => {
    async function loadDatasets() {
      if (!user) return;
      
      try {
        const data = await fetchDatasets(supabase);
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDatasetId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      } finally {
        setLoading(false);
      }
    }

    loadDatasets();
  }, [user]);

  // Fetch due cards when dataset changes
  useEffect(() => {
    async function loadDueCards() {
      if (!selectedDatasetId || !user) return;

      try {
        const processedCards = await fetchDueCards(selectedDatasetId, supabase);
        setDataPoints(processedCards);
        setCurrentIndex(0);
        setIsRevealed(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch due cards');
      }
    }

    loadDueCards();
  }, [selectedDatasetId, user]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleNext = () => {
    if (currentIndex < dataPoints.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
    }
  };

  const handleConfidence = async (confidence: 'easy' | 'medium' | 'hard') => {
    // TODO: Implement confidence tracking
    console.log('Confidence:', confidence);
    handleNext();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-red-600 text-2xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Normal Study Mode</h2>
      
      {/* Dataset Selector */}
      <div className="w-full max-w-xs mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Dataset</label>
        <Select
          value={selectedDatasetId}
          onValueChange={setSelectedDatasetId}
          disabled={datasets.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                datasets.length === 0
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
        {datasets.length === 0 && (
          <p className="text-sm text-red-500 mt-2">No datasets found. Please create a dataset to start studying.</p>
        )}
      </div>

      {/* Progress indicator */}
      {dataPoints.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-blue-800">Progress</h3>
            <span className="text-sm text-blue-600">
              {currentIndex + 1} of {dataPoints.length}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / dataPoints.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Card Display */}
      {dataPoints.length > 0 && currentIndex < dataPoints.length ? (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-6">Question {currentIndex + 1}</h3>
            
            {/* Question Content */}
            <div className="mb-8">
              <p className="text-lg text-gray-800 leading-relaxed">
                {dataPoints[currentIndex].content}
              </p>
            </div>

            {/* Answer (revealed when clicked) */}
            {isRevealed && dataPoints[currentIndex].label && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Answer:</h4>
                <p className="text-green-700">{dataPoints[currentIndex].label}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {!isRevealed ? (
                <button
                  onClick={handleReveal}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reveal Answer
                </button>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">How well did you know this?</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleConfidence('easy')}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Easy
                    </button>
                    <button
                      onClick={() => handleConfidence('medium')}
                      className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => handleConfidence('hard')}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Hard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === dataPoints.length - 1}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      ) : dataPoints.length === 0 && selectedDatasetId ? (
        <div className="text-center p-8">
          <div className="text-green-600 text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No cards due!</h3>
          <p className="text-gray-600">Great job! You&apos;ve completed all the cards in this dataset.</p>
        </div>
      ) : null}
    </div>
  );
} 