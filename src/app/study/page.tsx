'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";

type StudyMode = 'chatbot' | 'normal';

export default function StudyPage() {
  const [studyMode, setStudyMode] = useState<StudyMode>('normal');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Study" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Study Mode</h1>
          <Select
            value={studyMode}
            onValueChange={(value: StudyMode) => setStudyMode(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select study mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Study</SelectItem>
              <SelectItem value="chatbot">Chatbot Study</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-lg shadow">
          {studyMode === 'chatbot' ? (
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Chatbot Study Mode</h2>
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Chat with an AI tutor to help you learn and understand concepts better.
                  </p>
                </div>
                <div className="border rounded-lg p-4 min-h-[400px]">
                  <p className="text-center text-gray-500">
                    Chatbot interface coming soon...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Normal Study Mode</h2>
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Study your materials in a traditional format with flashcards and notes.
                  </p>
                </div>
                <div className="border rounded-lg p-4 min-h-[400px]">
                  <p className="text-center text-gray-500">
                    Study interface coming soon...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
