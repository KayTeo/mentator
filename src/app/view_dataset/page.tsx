'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Database } from '@/types/database';
import { Json } from '@/types/database';

type Dataset = Database['public']['Tables']['datasets']['Row'];
type DatasetDataPoint = {
  data_point_id: string;
  metadata: Json | null;
  label: string | null;
  created_at: string;
  data_points: {
    id: string;
    content: string;
  } | null;
};

export default function ViewDatasetPage() {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dataPoints, setDataPoints] = useState<DatasetDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth]);

  // Fetch all datasets
  useEffect(() => {
    const fetchDatasets = async () => {
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
  }, [supabase]);

  // Fetch specific dataset and its data points
  useEffect(() => {
    const datasetId = searchParams.get('id');
    if (!datasetId) {
      setLoading(false);
      return;
    }

    const fetchDatasetAndDataPoints = async () => {
      try {
        // Fetch dataset details
        const { data: datasetData, error: datasetError } = await supabase
          .from('datasets')
          .select('*')
          .eq('id', datasetId)
          .single();

        if (datasetError) throw datasetError;
        setDataset(datasetData);

        // Fetch data points with metadata from dataset_data_points
        const { data: dataPointsData, error: dataPointsError } = await supabase
          .from('dataset_data_points')
          .select(`
            data_point_id,
            metadata,
            label,
            created_at,
            data_points (
              id,
              content
            )
          `)
          .eq('dataset_id', datasetId)
          .order('created_at', { ascending: false });

        if (dataPointsError) throw dataPointsError;
        console.log('Dataset data points with metadata:', dataPointsData);
        setDataPoints((dataPointsData as unknown) as DatasetDataPoint[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dataset data');
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetAndDataPoints();
    console.log('Dataset data points:', dataPoints);
  }, [searchParams, supabase]);

  const handleDatasetChange = (datasetId: string) => {
    router.push(`/view_dataset?id=${datasetId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="View Dataset" />
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="View Dataset" />
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select a Dataset</h2>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            onChange={(e) => handleDatasetChange(e.target.value)}
            value={searchParams.get('id') || ''}
          >
            <option value="" disabled>Choose a dataset...</option>
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </div>

        {searchParams.get('id') && (
          <>
            {dataset && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
                {dataset.description && (
                  <p className="mt-2 text-gray-600">{dataset.description}</p>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {dataPoints.length === 0 ? (
                  <div className="px-6 py-4 text-gray-700 text-center">
                    No data points in this dataset yet.
                  </div>
                ) : (
                  dataPoints.map((point) => (
                    <div key={point.data_point_id} className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Content</h3>
                          <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                            {point.data_points?.content}
                          </p>
                        </div>

                        {point.label && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Label</h3>
                            <p className="mt-1 text-gray-900">{point.label}</p>
                          </div>
                        )}

                        {point.metadata && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Metadata</h3>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-900 overflow-x-auto">
                              {JSON.stringify(point.metadata, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          Added on {new Date(point.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
