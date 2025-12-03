import React from 'react';

interface InsightsPanelProps {
  type: 'explain' | 'debug' | 'optimize' | 'analyze' | 'indexes';
  data: any;
  onClose: () => void;
  onInsertSQL?: (sql: string) => void;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ type, data, onClose, onInsertSQL }) => {
  const renderExplainContent = () => (
    <div className="space-y-4">
      <div className="prose dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {data.explanation}
        </div>
      </div>
    </div>
  );

  const renderDebugContent = () => (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
          What was wrong:
        </h4>
        <p className="text-sm text-red-700 dark:text-red-400">{data.explanation}</p>
      </div>

      {data.fixed_query && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Fixed Query:
          </h4>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {data.fixed_query}
            </pre>
          </div>
          {onInsertSQL && (
            <button
              onClick={() => onInsertSQL(data.fixed_query)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Use Fixed Query
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderOptimizeContent = () => (
    <div className="space-y-4">
      {data.explanation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            Optimization Suggestions:
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
            {data.explanation}
          </p>
        </div>
      )}

      {data.suggestions && data.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Recommendations:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {data.suggestions.map((suggestion: string, index: number) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {data.optimized_query && data.optimized_query !== data.original_query && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Optimized Query:
          </h4>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {data.optimized_query}
            </pre>
          </div>
          {onInsertSQL && (
            <button
              onClick={() => onInsertSQL(data.optimized_query)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Use Optimized Query
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderAnalyzeContent = () => (
    <div className="space-y-4">
      {data.summary && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
            Summary:
          </h4>
          <p className="text-sm text-purple-700 dark:text-purple-400 whitespace-pre-wrap">
            {data.summary}
          </p>
        </div>
      )}

      {data.bottlenecks && data.bottlenecks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
            🚨 Performance Bottlenecks:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {data.bottlenecks.map((bottleneck: string, index: number) => (
              <li key={index}>{bottleneck}</li>
            ))}
          </ul>
        </div>
      )}

      {data.insights && data.insights.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            💡 Insights:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {data.insights.map((insight: string, index: number) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
            ✅ Recommendations:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {data.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {data.plan_text && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Show Raw EXPLAIN Output
          </summary>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-xs mt-2">
            <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {data.plan_text}
            </pre>
          </div>
        </details>
      )}
    </div>
  );

  const renderIndexesContent = () => (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-sm text-green-700 dark:text-green-400">
          Analyzed {data.analyzed_queries} recent queries
        </p>
      </div>

      {data.recommendations && data.recommendations.length > 0 ? (
        <div className="space-y-4">
          {data.recommendations.map((rec: any, index: number) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              {rec.table && (
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Table: {rec.table}
                  {rec.columns && ` (${rec.columns.join(', ')})`}
                </div>
              )}
              {rec.reason && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{rec.reason}</p>
              )}
              {rec.create_statement && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono text-xs">
                  <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {rec.create_statement}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No index recommendations found. Your database seems well-optimized!
        </div>
      )}
    </div>
  );

  const getTitleAndIcon = () => {
    switch (type) {
      case 'explain':
        return { title: 'Query Explanation', icon: '📖' };
      case 'debug':
        return { title: 'Query Debugger', icon: '🔧' };
      case 'optimize':
        return { title: 'Query Optimizer', icon: '⚡' };
      case 'analyze':
        return { title: 'Performance Analysis', icon: '📊' };
      case 'indexes':
        return { title: 'Index Recommendations', icon: '🔍' };
    }
  };

  const { title, icon } = getTitleAndIcon();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {type === 'explain' && renderExplainContent()}
          {type === 'debug' && renderDebugContent()}
          {type === 'optimize' && renderOptimizeContent()}
          {type === 'analyze' && renderAnalyzeContent()}
          {type === 'indexes' && renderIndexesContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;

