'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/database'
import { Header } from '@/components/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation';

type Dataset = Database['public']['Tables']['datasets']['Row']

// Create Supabase client once outside component to prevent re-creation on every render
const supabase = createClient()

/**
 * Manage datasets page component
 * 
 * This page allows users to create, view, and manage their datasets.
 * It is protected and requires authentication.
 */
function ManageDatasetsPageContent() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [newDatasetName, setNewDatasetName] = useState('')
  const [newDatasetDescription, setNewDatasetDescription] = useState('')
  const [creatingDataset, setCreatingDataset] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter();

  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user) return
      
      try {
        const { data: datasets, error } = await supabase
          .from('datasets')
          .select(`
            *,
            dataset_data_points (
              data_point_id
            )
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching datasets:', error)
          setError('Failed to load datasets')
        } else {
          setDatasets(datasets)
        }
      } catch {
        setError('Failed to load datasets')
      }
    }

    fetchDatasets()
  }, [user])

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDatasetName.trim()) return

    setCreatingDataset(true)
    setError(null)

    try {
      console.log("Creating dataset", newDatasetName.trim(), newDatasetDescription.trim())
      const { data: dataset, error } = await supabase
        .from('datasets')
        .insert({
          name: newDatasetName.trim(),
          user_id: user?.id,
          description: newDatasetDescription.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      setDatasets([dataset, ...datasets])
      setNewDatasetName('')
      setNewDatasetDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dataset')
    } finally {
      setCreatingDataset(false)
    }
  }

  const handleDeleteDataset = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', datasetId)

      if (error) throw error

      setDatasets(datasets.filter(ds => ds.id !== datasetId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dataset')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Manage Datasets" description="Create and manage your study datasets" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Manage Datasets</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Create New Dataset Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Dataset</h2>
            <form onSubmit={handleCreateDataset} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter dataset name..."
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={newDatasetDescription}
                  onChange={(e) => setNewDatasetDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter dataset description..."
                />
              </div>
              <button
                type="submit"
                disabled={creatingDataset || !newDatasetName.trim()}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingDataset ? 'Creating...' : 'Create Dataset'}
              </button>
            </form>
          </div>

          {/* Existing Datasets */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Your Datasets</h2>
            </div>
            <div className="divide-y">
              {datasets.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No datasets found. Create your first dataset above.
                </div>
              ) : (
                datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => router.push(`/manage_deck?id=${dataset.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{dataset.name}</h3>
                      {dataset.description && (
                        <p className="text-gray-600 mt-1">{dataset.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Created: {new Date(dataset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteDataset(dataset.id); }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManageDatasetsPage() {
  return (
    <ProtectedRoute>
      <ManageDatasetsPageContent />
    </ProtectedRoute>
  )
}
