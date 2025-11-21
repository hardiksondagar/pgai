import React from 'react';

interface EditorToolbarProps {
  onExecute: () => void;
  onFormat: () => void;
  onSaveFavorite?: () => void;
  onShowHistory?: () => void;
  onShowFavorites?: () => void;
  isExecuting: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onExecute,
  onFormat,
  onSaveFavorite,
  onShowHistory,
  onShowFavorites,
  isExecuting,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className={`px-4 py-1.5 text-sm font-medium rounded transition ${
            isExecuting
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isExecuting ? 'Executing...' : 'Run (⌘↵)'}
        </button>

        <button
          onClick={onFormat}
          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Format (⌘K)
        </button>

        {onSaveFavorite && (
          <button
            onClick={onSaveFavorite}
            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title="Save as Favorite"
          >
            ⭐ Save
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {onShowHistory && (
          <button
            onClick={onShowHistory}
            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title="Query History"
          >
            📜 History
          </button>
        )}

        {onShowFavorites && (
          <button
            onClick={onShowFavorites}
            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title="Favorite Queries"
          >
            ⭐ Favorites
          </button>
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;

