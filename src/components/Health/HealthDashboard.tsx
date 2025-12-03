import React, { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';

interface HealthDashboardProps {
  connectionId: number;
  onClose: () => void;
}

const HealthDashboard: React.FC<HealthDashboardProps> = ({ connectionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bloat' | 'indexes' | 'cache'>('overview');

  useEffect(() => {
    loadHealthData();
  }, [connectionId]);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const response = await databaseAPI.getHealth(connectionId);
      setHealthData(response.data);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 75) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    }
  };

  const renderOverview = () => {
    const aiAnalysis = healthData?.ai_analysis;
    if (!aiAnalysis?.success) {
      return (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          AI analysis not available
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Health Score */}
        <div className={`p-6 rounded-lg ${getHealthBg(aiAnalysis.health_score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Overall Health Score
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {aiAnalysis.summary}
              </p>
            </div>
            <div className="text-center">
              <div className={`text-5xl font-bold ${getHealthColor(aiAnalysis.health_score)}`}>
                {aiAnalysis.health_score}
              </div>
              <div className={`text-2xl font-semibold ${getHealthColor(aiAnalysis.health_score)}`}>
                Grade {aiAnalysis.grade}
              </div>
            </div>
          </div>
        </div>

        {/* Critical Issues */}
        {aiAnalysis.critical_issues && aiAnalysis.critical_issues.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">
              🚨 Critical Issues ({aiAnalysis.critical_issues.length})
            </h4>
            <ul className="space-y-2">
              {aiAnalysis.critical_issues.map((issue: any, idx: number) => (
                <li key={idx} className="text-sm text-red-700 dark:text-red-400">
                  • {typeof issue === 'string' ? issue : issue.description || issue.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            📋 Action Items ({aiAnalysis.action_items?.length || 0})
          </h4>
          <div className="space-y-3">
            {aiAnalysis.action_items?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <h5 className="font-semibold text-gray-800 dark:text-gray-100">
                        {item.title}
                      </h5>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                    {item.impact && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        💡 Impact: {item.impact}
                      </p>
                    )}
                  </div>
                </div>
                {item.fix_sql && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Show SQL Fix
                    </summary>
                    <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded p-2 font-mono text-xs">
                      <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {item.fix_sql}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBloatTab = () => {
    const tables = healthData?.bloat?.tables || [];
    const bloatedTables = tables.filter((t: any) => t.bloat_percent > 10);

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Found {bloatedTables.length} tables with &gt;10% bloat
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Table
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Size
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Bloat %
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Dead Tuples
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Last Vacuum
                </th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium">{table.tablename}</td>
                  <td className="px-4 py-3">{table.total_size}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        table.bloat_percent > 30
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : table.bloat_percent > 10
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }
                    >
                      {table.bloat_percent}%
                    </span>
                  </td>
                  <td className="px-4 py-3">{table.n_dead_tup?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">
                    {table.last_autovacuum
                      ? new Date(table.last_autovacuum).toLocaleString()
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIndexesTab = () => {
    const indexes = healthData?.indexes?.indexes || [];
    const unusedIndexes = indexes.filter((i: any) => i.idx_scan === 0);

    return (
      <div className="space-y-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Found {unusedIndexes.length} unused indexes
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Index
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Table
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Size
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Scans
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {indexes.map((index: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium font-mono text-xs">{index.indexname}</td>
                  <td className="px-4 py-3">{index.tablename}</td>
                  <td className="px-4 py-3">{index.index_size}</td>
                  <td className="px-4 py-3">{index.idx_scan?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {index.idx_scan === 0 ? (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
                        Unused
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCacheTab = () => {
    const overall = healthData?.cache?.overall || {};
    const tables = healthData?.cache?.tables || [];

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${getHealthBg(overall.cache_hit_ratio || 0)}`}>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Overall Cache Hit Ratio
          </h4>
          <div className={`text-3xl font-bold ${getHealthColor(overall.cache_hit_ratio || 0)}`}>
            {overall.cache_hit_ratio}%
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {overall.cache_hit_ratio >= 90
              ? '✅ Excellent - Most data served from cache'
              : overall.cache_hit_ratio >= 80
              ? '⚠️ Good - Some disk reads occurring'
              : '🔴 Poor - Consider increasing shared_buffers'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Table
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Cache Hit %
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Heap Reads
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Heap Hits
                </th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium">{table.tablename}</td>
                  <td className="px-4 py-3">
                    <span className={getHealthColor(table.cache_hit_ratio)}>
                      {table.cache_hit_ratio}%
                    </span>
                  </td>
                  <td className="px-4 py-3">{table.heap_blks_read?.toLocaleString()}</td>
                  <td className="px-4 py-3">{table.heap_blks_hit?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Database Health Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadHealthData}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'bloat', label: 'Bloat', icon: '💨' },
            { id: 'indexes', label: 'Indexes', icon: '🔍' },
            { id: 'cache', label: 'Cache', icon: '⚡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">Loading health data...</div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'bloat' && renderBloatTab()}
              {activeTab === 'indexes' && renderIndexesTab()}
              {activeTab === 'cache' && renderCacheTab()}
            </>
          )}
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

export default HealthDashboard;

