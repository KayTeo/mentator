'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/database'
import { Header } from '@/components/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

type Dataset = Database['public']['Tables']['datasets']['Row']

/**
 * Add data page component
 * 
 * This page allows users to add new data points to their datasets.
 * It is protected and requires authentication.
 */
function AddDataPageContent() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user) return
      
      try {
        const { data: datasets, error } = await supabase
          .from('datasets')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching datasets:', error)
          setError('Failed to load datasets')
        } else {
          setDatasets(datasets)
          // Set initial dataset from URL if present
          const params = new URLSearchParams(window.location.search)
          const datasetId = params.get('dataset')
          if (datasetId) {
            setSelectedDataset(datasetId)
          }
        }
              } catch {
          setError('Failed to load datasets')
        }
    }

    fetchDatasets()
  }, [user, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDataset || !content.trim()) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // First, create the data point
      const { data: dataPoint, error: dataPointError } = await supabase
        .from('data_points')
        .insert({
          content: content.trim(),
          label: label.trim() || null
        })
        .select()
        .single()

      if (dataPointError) throw dataPointError

      // Then, link it to the dataset
      const { error: linkError } = await supabase
        .from('dataset_data_points')
        .insert({
          dataset_id: selectedDataset,
          data_point_id: dataPoint.id
        })

      if (linkError) throw linkError

      setSuccess('Data point added successfully!')
      setContent('')
      setLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add data point')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Add Data" description="Add new data points to your datasets" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Add New Data Point</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="dataset" className="block text-sm font-medium text-gray-700 mb-2">
                Dataset
              </label>
              <select
                id="dataset"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a dataset</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter the content for this data point..."
                required
              />
            </div>

            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
                Label (Optional)
              </label>
              <input
                type="text"
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a label for this data point..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedDataset || !content.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add Data Point'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddDataPage() {
  return (
    <ProtectedRoute>
      <AddDataPageContent />
    </ProtectedRoute>
  )
}
