'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Dataset = Database['public']['Tables']['datasets']['Row']

export default function AddDataPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        // Fetch user's datasets
        const { data: datasets, error } = await supabase
          .from('datasets')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching datasets:', error)
        } else {
          setDatasets(datasets)
          // Set initial dataset from URL if present
          const params = new URLSearchParams(window.location.search)
          const datasetId = params.get('dataset')
          if (datasetId) {
            setSelectedDataset(datasetId)
          }
        }
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedDataset || !content.trim() || !label.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      // Create the data point
      const { data: dataPoint, error: dataPointError } = await supabase
        .from('data_points')
        .insert({
          user_id: user.id,
          content: content.trim(),
          label: label.trim()
        })
        .select()
        .single()

      if (dataPointError) throw dataPointError

      // Create the association
      const { error: associationError } = await supabase
        .from('dataset_data_points')
        .insert({
          dataset_id: selectedDataset,
          data_point_id: dataPoint.id
        })

      if (associationError) throw associationError

      // Reset form
      setContent('')
      setLabel('')
      setSuccess('Data point added successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error adding data point:', err)
      setError('Failed to add data point. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Add Data" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Add Data</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700 mb-6">
            Welcome, {user?.email}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="dataset" className="block text-sm font-medium text-gray-700 mb-1">
                Select Dataset
              </label>
              <select
                id="dataset"
                value={selectedDataset}
                onChange={(e) => {
                  if (e.target.value === 'create') {
                    router.push('/manage_datasets')
                  } else {
                    setSelectedDataset(e.target.value)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select a dataset</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
                <option value="create" className="text-indigo-600 font-medium">+ Create dataset</option>
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Data Point Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your data point content here..."
                required
              />
            </div>

            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                Label (Answer)
              </label>
              <input
                type="text"
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter the answer/label..."
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Data Point'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
