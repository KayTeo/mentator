'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

type Dataset = Database['public']['Tables']['datasets']['Row'];
type DatasetDataPoint = Database['public']['Tables']['dataset_data_points']['Row'] & {
  data_points: Database['public']['Tables']['data_points']['Row'];
};

// Create Supabase client once outside component to prevent re-creation on every render
const supabase = createClient();

/**
 * View dataset page component
 * 
 * This page displays the contents of a specific dataset with its data points.
 * It is protected and requires authentication.
 */
function ViewDatasetPageContent() {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dataPoints, setDataPoints] = useState<DatasetDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Fetch all datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user) return;
      
      try {
        const { data: datasetsData, error: datasetsError } = await supabase
          .from('datasets')
          .select('*')
          .order('name');

        if (datasetsError) throw datasetsError;
        setDatasets(datasetsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      }
    };

    fetchDatasets();
  }, [user]);

  // Fetch data points for selected dataset
  useEffect(() => {
    const fetchDataPoints = async () => {
      const datasetId = searchParams.get('id');
      if (!datasetId || !user) return;

      setLoading(true);
      try {
        // Get dataset info
        const { data: datasetData, error: datasetError } = await supabase
          .from('datasets')
          .select('*')
          .eq('id', datasetId)
          .single();

        if (datasetError) throw datasetError;
        setDataset(datasetData);

        // Get data points for this dataset
        const { data: dataPointsData, error: dataPointsError } = await supabase
          .from('dataset_data_points')
          .select(`
            *,
            data_points (*)
          `)
          .eq('dataset_id', datasetId)
          .order('created_at', { ascending: false });

        if (dataPointsError) throw dataPointsError;
        setDataPoints(dataPointsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dataset data');
      } finally {
        setLoading(false);
      }
    };

    fetchDataPoints();
  }, [searchParams, user]);

  const handleDatasetChange = (datasetId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', datasetId);
    window.history.pushState({}, '', url.toString());
    // Trigger a page reload to fetch new data
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="View Dataset" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dataset...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="View Dataset" description="Browse your dataset contents" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">View Dataset</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Dataset Selector */}
          <div className="mb-6">
            <label htmlFor="dataset-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <select
              id="dataset-select"
              value={dataset?.id || ''}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a dataset...</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Info */}
          {dataset && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-2">{dataset.name}</h2>
              {dataset.description && (
                <p className="text-gray-600 mb-4">{dataset.description}</p>
              )}
              <div className="text-sm text-gray-500">
                Created: {new Date(dataset.created_at).toLocaleDateString()} • 
                {dataPoints.length} data point{dataPoints.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Data Points List */}
          {dataset && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold">Data Points</h3>
              </div>
              <div className="divide-y">
                {dataPoints.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No data points found in this dataset.
                  </div>
                ) : (
                  dataPoints.map((dp) => (
                    <div key={dp.data_point_id} className="p-6">
                      <div className="mb-2">
                        <h4 className="font-medium text-gray-900">Content:</h4>
                        <p className="text-gray-700 mt-1">{dp.data_points.content}</p>
                      </div>
                      {dp.data_points.label && (
                        <div>
                          <h4 className="font-medium text-gray-900">Label:</h4>
                          <p className="text-gray-700 mt-1">{dp.data_points.label}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Added: {new Date(dp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ViewDatasetPage() {
  return (
    <ProtectedRoute>
      <ViewDatasetPageContent />
    </ProtectedRoute>
  );
}
