import React, { useState } from 'react';
import { QueryTab as QueryTabType, QueryResult } from '../../types';
import SQLEditor from '../Editor/SQLEditor';
import ResultsGrid from '../Results/ResultsGrid';
import QueryHistory from '../History/QueryHistory';
import FavoriteQueries from '../History/FavoriteQueries';
import { queryAPI, favoritesAPI } from '../../services/api';

interface QueryTabProps {
  tab: QueryTabType;
  connectionId: number;
  onContentChange: (content: string) => void;
  onResultChange: (result: QueryResult | undefined) => void;
  theme?: 'light' | 'dark';
}

const QueryTab: React.FC<QueryTabProps> = ({
  tab,
  connectionId,
  onContentChange,
  onResultChange,
  theme = 'dark',
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSaveFavorite, setShowSaveFavorite] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');

  const handleExecute = async (query: string) => {
    if (!query.trim()) return;

    setIsExecuting(true);
    try {
      const response = await queryAPI.execute(connectionId, query);
      onResultChange(response.data);
    } catch (error: any) {
      onResultChange({
        success: false,
        error: error.response?.data?.error || 'Failed to execute query',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFormat = async (query: string) => {
    try {
      const response = await queryAPI.format(connectionId, query);
      onContentChange(response.data.formatted);
    } catch (error) {
      console.error('Failed to format SQL:', error);
    }
  };

  const handleSaveFavorite = async () => {
    if (!tab.content.trim()) return;

    const name = prompt('Enter a name for this query:');
    if (!name) return;

    try {
      await favoritesAPI.create({
        name,
        query: tab.content,
        connection_id: connectionId,
      });
      alert('Query saved to favorites!');
    } catch (error) {
      console.error('Failed to save favorite:', error);
      alert('Failed to save favorite');
    }
  };

  const handleSelectQuery = (query: string) => {
    onContentChange(query);
    setShowHistory(false);
    setShowFavorites(false);
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className={tab.result ? "h-1/2 flex flex-col" : "flex-1 flex flex-col"}>
          <SQLEditor
            value={tab.content}
            onChange={onContentChange}
            onExecute={handleExecute}
            onFormat={handleFormat}
            onSaveFavorite={handleSaveFavorite}
            onShowHistory={() => setShowHistory(true)}
            onShowFavorites={() => setShowFavorites(true)}
            isExecuting={isExecuting}
            theme={theme}
            connectionId={connectionId}
          />
        </div>

        {tab.result && (
          <div className="h-1/2 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
            <ResultsGrid result={tab.result} />
          </div>
        )}
      </div>

      {showHistory && (
        <QueryHistory
          connectionId={connectionId}
          onSelectQuery={handleSelectQuery}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showFavorites && (
        <FavoriteQueries
          connectionId={connectionId}
          onSelectQuery={handleSelectQuery}
          onClose={() => setShowFavorites(false)}
        />
      )}
    </>
  );
};

export default QueryTab;

