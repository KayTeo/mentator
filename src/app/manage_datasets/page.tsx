'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Dataset = Database['public']['Tables']['datasets']['Row'] & {
  dataset_data_points: { data_point_id: string }[]
}

export default function ManageDatasetsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [newDatasetName, setNewDatasetName] = useState('')
  const [newDatasetDescription, setNewDatasetDescription] = useState('')
  const [creatingDataset, setCreatingDataset] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchDatasets()
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase.auth])

  const fetchDatasets = async () => {
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
  }

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newDatasetName.trim()) return

    setCreatingDataset(true)
    setError(null)

    try {
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: newDatasetName.trim(),
          description: newDatasetDescription.trim() || null
        })
        .select()
        .single()

      if (datasetError) throw datasetError

      // Add the new dataset to the list
      setDatasets([dataset, ...datasets])
      
      // Reset form
      setNewDatasetName('')
      setNewDatasetDescription('')
    } catch (err) {
      console.error('Error creating dataset:', err)
      setError('Failed to create dataset. Please try again.')
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

      // Remove the dataset from the list
      setDatasets(datasets.filter(d => d.id !== datasetId))
    } catch (err) {
      console.error('Error deleting dataset:', err)
      setError('Failed to delete dataset. Please try again.')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Datasets</h1>
        </div>

        {/* Create New Dataset Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Dataset</h2>
          <form onSubmit={handleCreateDataset} className="space-y-4">
            <div>
              <label htmlFor="datasetName" className="block text-sm font-medium text-gray-700 mb-1">
                Dataset Name
              </label>
              <input
                type="text"
                id="datasetName"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter dataset name"
                required
              />
            </div>
            <div>
              <label htmlFor="datasetDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="datasetDescription"
                value={newDatasetDescription}
                onChange={(e) => setNewDatasetDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter dataset description"
              />
            </div>
            <button
              type="submit"
              disabled={creatingDataset || !newDatasetName.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {creatingDataset ? 'Creating...' : 'Create Dataset'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Dataset List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your Datasets</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {datasets.length === 0 ? (
              <div className="px-6 py-4 text-gray-700 text-center">
                No datasets created yet. Create your first dataset above!
              </div>
            ) : (
              datasets.map((dataset) => (
                <div key={dataset.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{dataset.name}</h3>
                      {dataset.description && (
                        <p className="mt-1 text-sm text-gray-700">{dataset.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-700">
                        <span>Created: {new Date(dataset.created_at).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>{dataset.dataset_data_points?.length || 0} data points</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => router.push(`/add_data?dataset=${dataset.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Add Data
                      </button>
                      <button
                        onClick={() => handleDeleteDataset(dataset.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
