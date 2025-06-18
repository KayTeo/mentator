'use client';

import { useRef } from 'react';
import { Button } from '@/components/Button';
import { useChat } from '@ai-sdk/react';

export function ChatbotStudy() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Chatbot Study Mode</h2>
      <div className="flex flex-col gap-4">
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
              placeholder="Type your question..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              autoFocus
            />
            <Button
              disabled={isLoading || !input.trim()}
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