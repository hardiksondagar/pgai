import React, { useState, useEffect } from 'react';
import { QueryHistory } from '../../types';
import { historyAPI, aiAPI } from '../../services/api';

interface SlowQueriesPanelProps {
  connectionId: number;
  onClose: () => void;
  onSelectQuery?: (query: string) => void;
}

const SlowQueriesPanel: React.FC<SlowQueriesPanelProps> = ({
  connectionId,
  onClose,
  onSelectQuery,
}) => {
  const [slowQueries, setSlowQueries] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [minTime, setMinTime] = useState(1.0);
  const [selectedQueries, setSelectedQueries] = useState<Set<number>>(new Set());
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [dataSource, setDataSource] = useState<string>('none');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('auto');

  useEffect(() => {
    loadSlowQueries();
  }, [connectionId, minTime, selectedSource]);

  const loadSlowQueries = async () => {
    setLoading(true);
    try {
      const response = await historyAPI.getSlowQueries(connectionId, minTime, 50, selectedSource);
      setSlowQueries(response.data.queries || []);
      setDataSource(response.data.source || 'none');
      setAvailableSources(response.data.sources_available || []);
    } catch (error) {
      console.error('Failed to load slow queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuerySelection = (id: number) => {
    const newSelection = new Set(selectedQueries);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedQueries(newSelection);
  };

  const handleAnalyzeSelected = async () => {
    if (selectedQueries.size === 0) return;

    setAnalyzing(true);
    try {
      const queriesToAnalyze = slowQueries.filter((q) => selectedQueries.has(q.id));
      const response = await aiAPI.analyzeSlowQueries(connectionId, queriesToAnalyze);

      if (response.data.success) {
        setAnalysisResult(response.data);
      } else {
        alert(response.data.error || 'Failed to analyze queries');
      }
    } catch (error: any) {
      console.error('Failed to analyze queries:', error);
      alert('Failed to analyze queries: ' + (error.response?.data?.error || error.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const truncateQuery = (query: string, maxLength: number = 80) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  };

  const getTimeColor = (time: number) => {
    if (time >= 5) return 'text-red-600 dark:text-red-400 font-bold';
    if (time >= 2) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  if (analysisResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Slow Query Analysis Results
              </h2>
            </div>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {analysisResult.summary && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Summary
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                  {analysisResult.summary}
                </p>
              </div>
            )}

            {analysisResult.analyses && analysisResult.analyses.length > 0 && (
              <div className="space-y-4">
                {analysisResult.analyses.map((analysis: any, idx: number) => {
                  const originalQuery = Array.from(selectedQueries)[idx];
                  const queryData = slowQueries.find((q) => q.id === originalQuery);

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Query #{analysis.query_number || idx + 1}
                        </h4>
                        {analysis.estimated_improvement && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                            {analysis.estimated_improvement}
                          </span>
                        )}
                      </div>

                      {queryData && (
                        <div className="mb-3 bg-gray-50 dark:bg-gray-900 rounded p-2 font-mono text-xs">
                          <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                            {queryData.query}
                          </pre>
                        </div>
                      )}

                      {analysis.issues && analysis.issues.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                            Issues:
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            {analysis.issues.map((issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                            Recommendations:
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            {analysis.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.indexes && analysis.indexes.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">
                            Suggested Indexes:
                          </h5>
                          {analysis.indexes.map((idx: string, i: number) => (
                            <div
                              key={i}
                              className="bg-gray-50 dark:bg-gray-900 rounded p-2 font-mono text-xs mb-2"
                            >
                              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                                {idx}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Back to Queries
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Slow Queries Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            Source:
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option value="auto">Auto (Best Available)</option>
              <option value="pg_stat">PostgreSQL Stats</option>
              <option value="history">Application History</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            Min time:
            <select
              value={minTime}
              onChange={(e) => setMinTime(parseFloat(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option value={0.5}>≥ 0.5s</option>
              <option value={1.0}>≥ 1.0s</option>
              <option value={2.0}>≥ 2.0s</option>
              <option value={5.0}>≥ 5.0s</option>
            </select>
          </label>

          <div className="flex-1" />

          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {dataSource !== 'none' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                {dataSource === 'pg_stat_statements' ? '📊 PostgreSQL Stats' : '📝 App History'}
              </span>
            )}
            <span>{slowQueries.length} queries found</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading slow queries...
            </div>
          ) : slowQueries.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <div className="text-gray-500 dark:text-gray-400">
                No slow queries found in {dataSource === 'pg_stat_statements' ? 'PostgreSQL statistics' : 'application history'}.
              </div>
              {dataSource === 'application_history' && (
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  💡 Tip: Install <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">pg_stat_statements</code> extension for better query tracking:
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    CREATE EXTENSION pg_stat_statements;
                  </pre>
                </div>
              )}
              <div className="text-sm text-gray-400 dark:text-gray-500">
                Try adjusting the minimum execution time filter or run some queries first.
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedQueries.size === slowQueries.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQueries(new Set(slowQueries.map((q) => q.id)));
                        } else {
                          setSelectedQueries(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Query
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-32">
                    Avg Time
                  </th>
                  {dataSource === 'pg_stat_statements' && (
                    <>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-24">
                        Calls
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-32">
                        Total Time
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-32">
                        Max Time
                      </th>
                    </>
                  )}
                  {dataSource === 'application_history' && (
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-48">
                      Executed At
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {slowQueries.map((query) => (
                  <React.Fragment key={query.id}>
                    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedQueries.has(query.id)}
                          onChange={() => toggleQuerySelection(query.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-gray-800 dark:text-gray-200">
                          {expandedQuery === query.id
                            ? query.query
                            : truncateQuery(query.query)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getTimeColor(query.execution_time)}>
                          {query.execution_time.toFixed(3)}s
                        </span>
                      </td>
                      {dataSource === 'pg_stat_statements' && (
                        <>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                            {(query as any).calls?.toLocaleString() || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                            {(query as any).total_time ? `${(query as any).total_time.toFixed(2)}s` : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                            {(query as any).max_time ? `${(query as any).max_time.toFixed(3)}s` : '-'}
                          </td>
                        </>
                      )}
                      {dataSource === 'application_history' && (
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                          {formatDate(query.executed_at)}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setExpandedQuery(expandedQuery === query.id ? null : query.id)
                            }
                            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                            title="Toggle full query"
                          >
                            {expandedQuery === query.id ? '▲' : '▼'}
                          </button>
                          {onSelectQuery && (
                            <button
                              onClick={() => onSelectQuery(query.query)}
                              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded"
                              title="Use this query"
                            >
                              Use
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedQueries.size > 0 && `${selectedQueries.size} selected`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAnalyzeSelected}
              disabled={selectedQueries.size === 0 || analyzing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing
                ? 'Analyzing...'
                : `Analyze Selected (${selectedQueries.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlowQueriesPanel;

