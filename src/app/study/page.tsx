'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { ChatbotStudy } from './ChatbotStudy';
import { NormalStudy } from './NormalStudy';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

type StudyMode = 'chat' | 'normal';

/**
 * Study page component that provides different study modes
 * 
 * This page is protected and requires authentication. Users can choose
 * between normal study mode and chatbot study mode.
 */
function StudyPageContent() {
  const [studyMode, setStudyMode] = useState<StudyMode>('chat');

  return (
    <div className="min-h-screen bg-background">
      <Header title="Study" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Study Mode</h1>
          <Select
            value={studyMode}
            onValueChange={(value: StudyMode) => setStudyMode(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select study mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Study</SelectItem>
              <SelectItem value="chat">Chatbot Study</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-background rounded-lg shadow">
          {studyMode === 'chat' ? <ChatbotStudy /> : <NormalStudy />}
        </div>
      </div>
    </div>
  );
}

export default function StudyPage() {
  return (
    <ProtectedRoute>
      <StudyPageContent />
    </ProtectedRoute>
  );
}
