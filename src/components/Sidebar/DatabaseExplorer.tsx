import React, { useState, useEffect } from 'react';
import { Table } from '../../types';
import { databaseAPI } from '../../services/api';
import TableTree from './TableTree';
import TableSearch from './TableSearch';

interface DatabaseExplorerProps {
  connectionId: number;
}

const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ connectionId }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Database Explorer
          </h2>
          <button
            onClick={refreshSchema}
            disabled={loading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-sm"
            title="Refresh Schema Cache"
          >
            {loading ? '⏳' : '🔄'}
          </button>
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
  );
};

export default DatabaseExplorer;

