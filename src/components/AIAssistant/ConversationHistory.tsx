import React from 'react';
import { AIConversation } from '../../types';

interface ConversationHistoryProps {
  conversations: AIConversation[];
  onInsert: (sql: string) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  onInsert,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Reverse to show oldest first (chat style)
  const sortedConversations = [...conversations].reverse();

  return (
    <div className="p-4 space-y-4">
      {sortedConversations.map((conv) => (
        <div key={conv.id} className="space-y-3">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-[85%]">
              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                <p className="text-sm whitespace-pre-wrap">{conv.user_prompt}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {formatTime(conv.created_at)}
              </p>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-2">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">
                    AI Assistant
                  </span>
                </div>
                <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap overflow-x-auto">
{conv.generated_sql}
                </pre>
                {conv.generated_sql && (
                  <button
                    onClick={() => onInsert(conv.generated_sql)}
                    className="mt-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-1"
                  >
                    <span>📝</span>
                    <span>Insert SQL</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTime(conv.created_at)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationHistory;

