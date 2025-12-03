import React, { useState, useEffect } from 'react';
import { Table } from '../../types';
import { databaseAPI, aiAPI } from '../../services/api';
import TableTree from './TableTree';
import TableSearch from './TableSearch';
import InsightsPanel from '../AIAssistant/InsightsPanel';
import SlowQueriesPanel from '../Performance/SlowQueriesPanel';
import HealthDashboard from '../Health/HealthDashboard';

interface DatabaseExplorerProps {
  connectionId: number;
}

const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ connectionId }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [indexInsights, setIndexInsights] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSlowQueries, setShowSlowQueries] = useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);

  useEffect(() => {
    loadTables();
  }, [connectionId]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredTables(
        tables.filter(table =>
          table.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredTables(tables);
    }
  }, [searchTerm, tables]);

  const loadTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await databaseAPI.getTables(connectionId);
      setTables(response.data);
      setFilteredTables(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const refreshSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call refresh schema endpoint to update cache
      await databaseAPI.refreshSchema(connectionId);
      // Then reload tables to show updated list
      const response = await databaseAPI.getTables(connectionId);
      setTables(response.data);
      setFilteredTables(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to refresh schema');
    } finally {
      setLoading(false);
    }
  };

  const handleIndexAdvisor = async () => {
    setIsAnalyzing(true);
    try {
      const response = await aiAPI.suggestIndexes(connectionId);
      if (response.data.success) {
        setIndexInsights(response.data);
      } else {
        alert(response.data.error || 'Failed to analyze indexes');
      }
    } catch (err: any) {
      console.error('Failed to get index suggestions:', err);
      alert('Failed to analyze indexes: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Database Explorer
          </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHealthDashboard(true)}
                disabled={loading}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition text-sm"
                title="Database Health"
              >
                🏥
              </button>
              <button
                onClick={() => setShowSlowQueries(true)}
                disabled={loading}
                className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition text-sm"
                title="Slow Queries Analysis"
              >
                ⏱️
              </button>
              <button
                onClick={handleIndexAdvisor}
                disabled={isAnalyzing || loading}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition text-sm"
                title="AI Index Advisor"
              >
                {isAnalyzing ? '⏳' : '🔍'}
              </button>
              <button
                onClick={refreshSchema}
                disabled={loading}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-sm"
                title="Refresh Schema Cache"
              >
                {loading ? '⏳' : '🔄'}
              </button>
            </div>
        </div>
        <TableSearch value={searchTerm} onChange={setSearchTerm} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-3 text-gray-500 dark:text-gray-400 text-sm">
            Loading tables...
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-3 text-gray-500 dark:text-gray-400 text-sm">
            {searchTerm ? 'No tables found' : 'No tables in database'}
          </div>
        ) : (
          <TableTree tables={filteredTables} connectionId={connectionId} />
        )}
      </div>
    </div>

      {indexInsights && (
        <InsightsPanel
          type="indexes"
          data={indexInsights}
          onClose={() => setIndexInsights(null)}
        />
      )}

      {showSlowQueries && (
        <SlowQueriesPanel
          connectionId={connectionId}
          onClose={() => setShowSlowQueries(false)}
        />
      )}

      {showHealthDashboard && (
        <HealthDashboard
          connectionId={connectionId}
          onClose={() => setShowHealthDashboard(false)}
        />
      )}
    </>
  );
};

export default DatabaseExplorer;

