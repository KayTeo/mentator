'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { useChat } from '@ai-sdk/react';
import { createClient } from '@/utils/supabase/client';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Database } from '@/types/database';
import { learning_algorithm } from '@/lib/learning_algorithm';

export function ChatbotStudy() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [datasets, setDatasets] = useState<Database['public']['Tables']['datasets']['Row'][]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [currentCard, setCurrentCard] = useState<Database['public']['Tables']['data_points']['Row'] | null>(null);
  const [cardSet, setCardSet] = useState<Database['public']['Tables']['data_points']['Row'][]>([]);
  const supabase = createClient();

  // On mount, try to load persisted dataset
  useEffect(() => {
    const saved = localStorage.getItem('selectedDataset');
    if (saved) setSelectedDataset(saved);
  }, []);

  useEffect(() => {
    const fetchDatasets = async () => {
      setLoadingDatasets(true);
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setDatasets(data);
        // If no dataset is selected, pick the first one (or persisted one)
        if (!selectedDataset && data.length > 0) {
          const saved = localStorage.getItem('selectedDataset');
          setSelectedDataset(saved && data.some(ds => ds.id === saved) ? saved : data[0].id);
        }
      }
      setLoadingDatasets(false);
    };
    fetchDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Persist selection
  // Retrieve cards from dataset that need reviewing
  useEffect(() => {
    const fetchDueCards = async () => {
      if (!selectedDataset) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No authenticated user');
        }

        // Query dataset_data_points and join with data_points to get actual content
        const { data, error } = await supabase
          .from('dataset_data_points')
          .select(`
            data_point_id,
            data_points (
              id,
              user_id,
              content,
              label,
              created_at,
              updated_at,
              metadata
            )
          `)
          .eq('dataset_id', selectedDataset);

        if (error) {
          throw new Error('Failed to fetch due cards');
        }

        if (data) {
          // Extract the data_points from the joined result and flatten
          const dataPoints = data
            .map(row => row.data_points)
            .flat()
            .filter(point => point !== null) as Database['public']['Tables']['data_points']['Row'][];
          console.log("Data points are" + dataPoints);
          const processedCards = learning_algorithm(dataPoints);
          console.log("Processed cards are:", processedCards);
          setCardSet(processedCards);
          // Set first card if available
          if (dataPoints.length > 0) {
            setCurrentCard(dataPoints[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching due cards:', error);
      }
    };

    fetchDueCards();
  }, [selectedDataset, supabase]);

  // TODO: Implement logic to cycle through them
  useEffect(() => {
    if (cardSet.length > 0) {
      setCurrentCard(cardSet[0]);
    }
  }, [cardSet]);
  
  // TODO: Put message as context when accessing chat api
  useEffect(() => {
    if (selectedDataset) {
      localStorage.setItem('selectedDataset', selectedDataset);
    }
  }, [selectedDataset]);
  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading, error } = useChat({
    api: '/api/chat',
    body: {
      dataset_id: selectedDataset
    }
  });


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Chatbot Study Mode</h2>
      <div className="flex flex-col gap-4">
        <div className="w-full max-w-xs mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Dataset</label>
          <Select
            value={selectedDataset}
            onValueChange={setSelectedDataset}
            disabled={loadingDatasets || datasets.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  loadingDatasets
                    ? 'Loading datasets...'
                    : datasets.length === 0
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
          {(!loadingDatasets && datasets.length === 0) && (
            <p className="text-sm text-red-500 mt-2">No datasets found. Please create a dataset to start studying.</p>
          )}
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Chat with an AI tutor to help you learn and understand concepts better.
          </p>
        </div>
        <div className="border rounded-lg p-4 min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500">Start the conversation!</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg.id} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                  <span className={
                    msg.role === 'user'
                      ? 'inline-block bg-blue-100 text-blue-800 rounded-lg px-3 py-2 max-w-[80%]'
                      : 'inline-block bg-gray-200 text-gray-800 rounded-lg px-3 py-2 max-w-[80%]'
                  }>
                    {msg.parts.map((part, i) => {
                      if (part.type === 'text') {
                        return <span key={`${msg.id}-${i}`}>{part.text}</span>;
                      }
                      return null;
                    })}
                  </span>
                </div>
              ))
            )}
            {error && <div className="text-center text-red-500 text-sm">{error.message || String(error)}</div>}
          </div>
          <form className="flex gap-2 mt-auto" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
              placeholder={
                loadingDatasets
                  ? "Loading datasets..."
                  : datasets.length === 0
                    ? "No datasets found"
                    : selectedDataset
                      ? "Type your question..."
                      : "Select a dataset first"
              }
              value={input}
              onChange={handleInputChange}
              disabled={isLoading || !selectedDataset || datasets.length === 0}
              autoFocus
            />
            <Button
              disabled={isLoading || !input.trim() || !selectedDataset || datasets.length === 0}
              variant="primary"
              type="submit"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 