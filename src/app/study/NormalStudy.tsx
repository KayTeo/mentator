'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'
import { Json } from '@/types/database';

interface DataPoint {
  id: string;
  content: string;
  metadata: {
    question?: string;
    answer?: string;
  };
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
  } | null;
}

export function NormalStudy() {
  const [user, setUser] = useState<User | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
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
    console.log(error);
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
              content
            )
          `)
          .eq('dataset_id', selectedDatasetId);
        
        if (dataPointsError) {
          throw new Error(dataPointsError.message);
        }

        // Transform the data to match our DataPoint interface
        const points = (dataPointsData as unknown as DatasetDataPoint[])
          ?.map(item => ({
            id: item.data_points?.id || '',
            content: item.data_points?.content || '',
            metadata: item.metadata || {}
          }))
          .filter((point): point is DataPoint => point !== null);

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
        <div className="border rounded-lg p-4 min-h-[400px]">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : dataPoints.length === 0 ? (
            <p className="text-center text-gray-500">No data points found in this dataset</p>
          ) : (
            <div className="space-y-4">
              {dataPoints.map((point) => (
                <div key={point.id} className="border rounded-lg p-4">
                  <div className="mb-2">
                    <h3 className="font-medium">Question:</h3>
                    <p>{point.metadata.question || point.content}</p>
                  </div>
                  {point.metadata.answer && (
                    <div>
                      <h3 className="font-medium">Answer:</h3>
                      <p>{point.metadata.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 