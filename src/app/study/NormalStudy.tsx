'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'
import { Json } from '@/types/database';

interface DataPointMetadata {
  question?: string;
  answer?: string;
  loss_value?: number;
  [key: string]: unknown;
}

interface DataPoint {
  id: string;
  content: string;
  metadata: DataPointMetadata;
}

interface Dataset {
  id: string;
  name: string;
  description: string | null;
}

interface DatasetDataPoint {
  data_point_id: string;
  metadata: Json;
  data_points: {
    id: string;
    content: string;
    label: string | null;
  } | null;
}

export function NormalStudy() {
  const [user, setUser] = useState<User | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter()


  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase.auth])

  // Fetch available datasets
  useEffect(() => {
    async function fetchDatasets() {
      try {
        const { data: datasetsData, error: datasetsError } = await supabase
          .from('datasets')
          .select('id, name, description')
          .order('name');

        if (datasetsError) {
          throw new Error(datasetsError.message);
        }
        setDatasets(datasetsData || []);
        if (datasetsData && datasetsData.length > 0) {
          setSelectedDatasetId(datasetsData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      } finally {
        setLoading(false);
      }
    }

    fetchDatasets();
  }, [supabase]);

  // Fetch data points when a dataset is selected
  useEffect(() => {
    async function fetchDataPoints() {
      if (!selectedDatasetId) return;

      setLoading(true);
      try {
        const { data: dataPointsData, error: dataPointsError } = await supabase
          .from('dataset_data_points')
          .select(`
            data_point_id,
            metadata,
            data_points (
              id,
              content,
              label
            )
          `)
          .eq('dataset_id', selectedDatasetId);
        
        if (dataPointsError) {
          throw new Error(dataPointsError.message);
        }

        // Transform the raw data into our DataPoint format
        const points = (dataPointsData as unknown as DatasetDataPoint[])
          // Map each dataset_data_point to our DataPoint format
          ?.map(item => ({
            id: item.data_points?.id || '',          // Get the data point ID or empty string if null
            content: item.data_points?.content || '', // Get the content or empty string if null
            metadata: {
              ...(item.metadata as DataPointMetadata), // Spread existing metadata
              loss_value: (item.metadata as DataPointMetadata)?.loss_value ?? 0 // Set loss_value to 0 if undefined
            }
          }))
          // Filter out any null points and ensure type safety
          .filter((point): point is { id: string; content: string; metadata: { loss_value: number } & DataPointMetadata } => point !== null)
          // Sort points by loss_value in descending order (highest to lowest)
          // If loss_value is undefined, it defaults to 0
          .sort((a, b) => (b.metadata.loss_value || 0) - (a.metadata.loss_value || 0));

        setDataPoints(points || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data points');
        setDataPoints([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDataPoints();
  }, [selectedDatasetId, supabase]);

  const handleDifficultySelect = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentPoint = dataPoints[currentIndex];
    if (!currentPoint) return;

    const lossValue = {
      easy: 0.1,
      medium: 0.5,
      hard: 0.9
    }[difficulty];

    try {
      // Update the loss_value in dataset_data_points
      const { error: updateError } = await supabase
        .from('dataset_data_points')
        .update({ metadata: { ...currentPoint.metadata, loss_value: lossValue } })
        .eq('dataset_id', selectedDatasetId)
        .eq('data_point_id', currentPoint.id);
      if (updateError) throw updateError;

      // Update local state
      const updatedPoints = [...dataPoints];
      updatedPoints[currentIndex] = {
        ...currentPoint,
        metadata: { ...currentPoint.metadata, loss_value: lossValue }
      };
      setDataPoints(updatedPoints);

      // Move to next point or show completion
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update difficulty');
    }
    
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Normal Study Mode</h2>
      <div className="flex flex-col gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Study your materials in a traditional format with flashcards and notes.
            </p>
            <div className="w-[300px]">
              <Select
                value={selectedDatasetId}
                onValueChange={setSelectedDatasetId}
                disabled={loading || datasets.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4 min-h-[400px] flex flex-col items-center justify-center">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : dataPoints.length === 0 ? (
            <p className="text-center text-gray-500">No data points found in this dataset</p>
          ) : currentIndex >= dataPoints.length ? (
            <div className="text-center space-y-4">
              <p className="text-xl font-medium">You've completed all cards!</p>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsRevealed(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Start Over
              </button>
            </div>
          ) : (
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center text-lg">
                {dataPoints[currentIndex].content}
              </div>
              {!isRevealed ? (
                <button
                  onClick={() => setIsRevealed(true)}
                  className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reveal Answer
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-medium mb-2">Answer:</h3>
                    <p>{dataPoints[currentIndex].metadata.answer}</p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleDifficultySelect('easy')}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Easy
                    </button>
                    <button
                      onClick={() => handleDifficultySelect('medium')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => handleDifficultySelect('hard')}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Hard
                    </button>
                  </div>
                </div>
              )}
              <div className="text-center text-sm text-gray-500">
                {currentIndex + 1} of {dataPoints.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 