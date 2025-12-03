import React, { useState } from 'react';
import { QueryTab as QueryTabType, QueryResult } from '../../types';
import SQLEditor from '../Editor/SQLEditor';
import ResultsGrid from '../Results/ResultsGrid';
import QueryHistory from '../History/QueryHistory';
import FavoriteQueries from '../History/FavoriteQueries';
import InsightsPanel from '../AIAssistant/InsightsPanel';
import { queryAPI, favoritesAPI, aiAPI } from '../../services/api';

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
  const [aiInsight, setAiInsight] = useState<{
    type: 'explain' | 'debug' | 'optimize' | 'analyze' | 'indexes';
    data: any;
  } | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

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

  const handleExplain = async () => {
    if (!tab.content.trim()) return;

    setIsAIProcessing(true);
    try {
      const response = await aiAPI.explainQuery(tab.content, connectionId);
      if (response.data.success && response.data.explanation) {
        setAiInsight({
          type: 'explain',
          data: response.data,
        });
      } else {
        alert(response.data.error || 'Failed to explain query');
      }
    } catch (error: any) {
      console.error('Failed to explain query:', error);
      alert('Failed to explain query: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleOptimize = async () => {
    if (!tab.content.trim()) return;

    setIsAIProcessing(true);
    try {
      const executionTime = tab.result?.execution_time;
      const response = await aiAPI.optimizeQuery(tab.content, connectionId, executionTime);
      if (response.data.success) {
        setAiInsight({
          type: 'optimize',
          data: response.data,
        });
      } else {
        alert(response.data.error || 'Failed to optimize query');
      }
    } catch (error: any) {
      console.error('Failed to optimize query:', error);
      alert('Failed to optimize query: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!tab.content.trim()) return;

    setIsAIProcessing(true);
    try {
      const response = await aiAPI.analyzeExplain(tab.content, connectionId);
      if (response.data.success) {
        setAiInsight({
          type: 'analyze',
          data: response.data,
        });
      } else {
        alert(response.data.error || 'Failed to analyze query');
      }
    } catch (error: any) {
      console.error('Failed to analyze query:', error);
      alert('Failed to analyze query: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleDebugQuery = async (query: string, error: string) => {
    setIsAIProcessing(true);
    try {
      const response = await aiAPI.debugQuery(query, error, connectionId);
      if (response.data.success) {
        setAiInsight({
          type: 'debug',
          data: response.data,
        });
      } else {
        alert(response.data.error || 'Failed to debug query');
      }
    } catch (error: any) {
      console.error('Failed to debug query:', error);
      alert('Failed to debug query: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleInsertSQL = (sql: string) => {
    onContentChange(sql);
    setAiInsight(null);
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
            onExplain={handleExplain}
            onOptimize={handleOptimize}
            onAnalyze={handleAnalyze}
            isExecuting={isExecuting || isAIProcessing}
            theme={theme}
            connectionId={connectionId}
          />
        </div>

        {tab.result && (
          <div className="h-1/2 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
            <ResultsGrid
              result={tab.result}
              onDebugQuery={tab.result.error ? () => handleDebugQuery(tab.content, tab.result!.error!) : undefined}
            />
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

      {aiInsight && (
        <InsightsPanel
          type={aiInsight.type}
          data={aiInsight.data}
          onClose={() => setAiInsight(null)}
          onInsertSQL={handleInsertSQL}
        />
      )}
    </>
  );
};

export default QueryTab;

