import React, { useState, useEffect, useRef } from 'react';
import { AIConversation } from '../../types';
import { aiAPI } from '../../services/api';
import PromptInput from './PromptInput';
import ConversationHistory from './ConversationHistory';

interface AIPanelProps {
  connectionId?: number;
  onInsertSQL: (sql: string) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ connectionId, onInsertSQL }) => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (connectionId) {
      loadConversations();
    } else {
      setConversations([]);
    }
  }, [connectionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  const loadConversations = async () => {
    if (!connectionId) return;

    try {
      console.log(`Loading conversations for connection ${connectionId}...`);
      const response = await aiAPI.getConversations(connectionId);
      console.log(`Loaded ${response.data.length} conversations`);
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim() || !connectionId) return;

    setIsGenerating(true);
    setError(null);

    // Optimistically add user message to UI
    const tempUserMessage = {
      id: Date.now(),
      connection_id: connectionId,
      user_prompt: prompt,
      generated_sql: '',
      created_at: new Date().toISOString(),
    };
    setConversations(prev => [tempUserMessage, ...prev]);

    try {
      console.log(`Generating SQL for connection ${connectionId} with prompt:`, prompt);
      const response = await aiAPI.generateSQL(prompt, connectionId);

      if (response.data.success && response.data.sql) {
        console.log('SQL generated successfully, reloading conversations...');
        // Reload all conversations from server to get the saved one with proper ID
        await loadConversations();
        setError(null);
      } else {
        console.error('SQL generation failed:', response.data.error);
        // Remove the optimistic message on error
        setConversations(prev => prev.filter(c => c.id !== tempUserMessage.id));
        setError(response.data.error || 'Failed to generate SQL');
      }
    } catch (err: any) {
      // Remove the optimistic message on error
      setConversations(prev => prev.filter(c => c.id !== tempUserMessage.id));
      setError(err.response?.data?.error || 'Failed to generate SQL');
      console.error('AI generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = (sql: string) => {
    onInsertSQL(sql);
  };

  const handleClear = async () => {
    if (!confirm('Clear all conversation history?')) return;

    try {
      for (const conv of conversations) {
        await aiAPI.deleteConversation(conv.id);
      }
      setConversations([]);
    } catch (err) {
      console.error('Failed to clear conversations:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            AI Assistant
          </h2>
          {conversations.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Conversation History - Chat Style */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!connectionId ? (
          <div className="flex items-center justify-center h-full p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            <div>
              <div className="text-4xl mb-2">🤖</div>
              <p>Select a connection to start chatting with AI</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            <div>
              <div className="text-4xl mb-2">💬</div>
              <p>No conversations yet</p>
              <p className="text-xs mt-2">Ask AI to generate SQL queries!</p>
            </div>
          </div>
        ) : (
          <>
            <ConversationHistory
              conversations={conversations}
              onInsert={handleInsert}
            />
            <div ref={conversationEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 flex-shrink-0">
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Prompt Input */}
      <div className="flex-shrink-0">
        <PromptInput
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          disabled={!connectionId}
        />
      </div>
    </div>
  );
};

export default AIPanel;

