'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/Button';

// Types

type Dataset = Database['public']['Tables']['datasets']['Row'];
type DataPoint = Database['public']['Tables']['data_points']['Row'];
type DatasetDataPoint = Database['public']['Tables']['dataset_data_points']['Row'] & {
  data_points: DataPoint;
};

// Create Supabase client once outside component to prevent re-creation on every render
const supabase = createClient();

/**
 * Manage Deck page component
 *
 * This page allows users to view, update, and delete data points in a single deck (dataset).
 * It is protected and requires authentication.
 */
function ManageDeckPageContent() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [dataPoints, setDataPoints] = useState<DatasetDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const datasetId = searchParams.get('id');

  // Fetch dataset and data points
  useEffect(() => {
    const fetchData = async () => {
      if (!datasetId || !user) return;
      setLoading(true);
      try {
        // Fetch dataset info
        const { data: datasetData, error: datasetError } = await supabase
          .from('datasets')
          .select('*')
          .eq('id', datasetId)
          .single();
        if (datasetError) throw datasetError;
        setDataset(datasetData);
        // Fetch data points for this dataset
        const { data: dataPointsData, error: dataPointsError } = await supabase
          .from('dataset_data_points')
          .select(`*, data_points (*)`)
          .eq('dataset_id', datasetId)
          .order('created_at', { ascending: false });
        if (dataPointsError) throw dataPointsError;
        setDataPoints(dataPointsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deck data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Start editing a data point
  const handleEdit = (dp: DatasetDataPoint) => {
    setEditId(dp.data_point_id);
    setEditContent(dp.data_points.content);
    setEditLabel(dp.data_points.label || '');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditId(null);
    setEditContent('');
    setEditLabel('');
  };

  // Update a data point
  const handleUpdate = async (dataPointId: string) => {
    setUpdating(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('data_points')
        .update({ content: editContent, label: editLabel })
        .eq('id', dataPointId);
      if (error) throw error;
      // Refresh data points
      setDataPoints((prev) =>
        prev.map((dp) =>
          dp.data_point_id === dataPointId
            ? { ...dp, data_points: { ...dp.data_points, content: editContent, label: editLabel } }
            : dp
        )
      );
      setEditId(null);
      setEditContent('');
      setEditLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update data point');
    } finally {
      setUpdating(false);
    }
  };

  // Delete a data point (removes from dataset, and optionally from data_points)
  const handleDelete = async (dataPointId: string) => {
    if (!confirm('Are you sure you want to delete this data point from the deck?')) return;
    setDeleting(dataPointId);
    setError(null);
    try {
      // Remove from dataset_data_points
      const { error: linkError } = await supabase
        .from('dataset_data_points')
        .delete()
        .eq('data_point_id', dataPointId)
        .eq('dataset_id', dataset?.id || '');
      if (linkError) throw linkError;
      // Optionally, also delete from data_points if you want to fully remove it (not just from this deck)
      // await supabase.from('data_points').delete().eq('id', dataPointId);
      setDataPoints((prev) => prev.filter((dp) => dp.data_point_id !== dataPointId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete data point');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Manage Deck" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading deck...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Manage Deck" description="View, update, or delete data points in this deck" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Manage Deck</h1>
            <Button variant="secondary" onClick={() => router.push('/manage_datasets')}>Back to Datasets</Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Deck Info */}
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
                    No data points found in this deck.
                  </div>
                ) : (
                  dataPoints.map((dp) => (
                    <Card key={dp.data_point_id} className="rounded-none border-0 border-b last:border-b-0">
                      <CardHeader>
                        <CardTitle>Content</CardTitle>
                        {editId === dp.data_point_id ? (
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={2}
                          />
                        ) : (
                          <p className="text-gray-700 mt-1">{dp.data_points.content}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <CardDescription>Label</CardDescription>
                        {editId === dp.data_point_id ? (
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-700 mt-1">{dp.data_points.label}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          Added: {new Date(dp.data_points.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        {editId === dp.data_point_id ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={updating}
                              onClick={() => handleUpdate(dp.data_point_id)}
                            >
                              {updating ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(dp)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleting === dp.data_point_id}
                              onClick={() => handleDelete(dp.data_point_id)}
                            >
                              {deleting === dp.data_point_id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
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

export default function ManageDeckPage() {
  return (
    <ProtectedRoute>
      <ManageDeckPageContent />
    </ProtectedRoute>
  );
}
