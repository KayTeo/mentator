'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Database } from '@/types/database';
import { fetchDatasets } from '@/utils/assorted/helper';
import { ChatbotInterface } from '@/components/study/ChatbotInterface';
import { useAuth } from '@/hooks/useAuth';

/**
 * Chatbot study mode component
 * 
 * This component provides an AI-powered study experience where users
 * can interact with a chatbot to answer questions and receive feedback.
 */
export function ChatbotStudy() {
  const [datasets, setDatasets] = useState<Database['public']['Tables']['datasets']['Row'][]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();

  // On mount, try to load persisted dataset
  useEffect(() => {
    const saved = localStorage.getItem('selectedDataset');
    if (saved) setSelectedDataset(saved);
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      localStorage.setItem('selectedDataset', selectedDataset);
    }
  }, [selectedDataset]);

  useEffect(() => {
    const loadDatasets = async () => {
      if (!user) return;
      
      setLoadingDatasets(true);
      try {
        const data = await fetchDatasets(supabase);
        setDatasets(data);
        // If no dataset is selected, pick the first one (or persisted one)
        if (!selectedDataset && data.length > 0) {
          const saved = localStorage.getItem('selectedDataset');
          setSelectedDataset(saved && data.some(ds => ds.id === saved) ? saved : data[0].id);
        }
      } catch (error) {
        console.error('Error loading datasets:', error);
      }
      setLoadingDatasets(false);
    };
    loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">AI-Powered Study Assessment</h2>
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
        
        {/* Chat Interface */}
        <ChatbotInterface
          datasetId={selectedDataset}
        />
      </div>
    </div>
  );
} 