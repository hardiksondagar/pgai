import React, { useState, useEffect } from 'react';
import { QueryHistory as QueryHistoryType } from '../../types';
import { historyAPI } from '../../services/api';

interface QueryHistoryProps {
  connectionId?: number;
  onSelectQuery: (query: string) => void;
  onClose: () => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({
  connectionId,
  onSelectQuery,
  onClose,
}) => {
  const [history, setHistory] = useState<QueryHistoryType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connectionId) {
      loadHistory();
    }
  }, [connectionId]);

  const loadHistory = async () => {
    if (!connectionId) return;

    setLoading(true);
    try {
      const response = await historyAPI.get(connectionId);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (historyId: number) => {
    try {
      await historyAPI.delete(historyId);
      setHistory(history.filter(h => h.id !== historyId));
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Query History
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No query history yet
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.executed_at)} • {item.execution_time}s
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onSelectQuery(item.query)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap overflow-x-auto">
                    {item.query}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryHistory;

