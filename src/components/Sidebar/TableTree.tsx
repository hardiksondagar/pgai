import React, { useState } from 'react';
import { Table, Column } from '../../types';
import { databaseAPI } from '../../services/api';
import TableDetailsView from '../TableDetails/TableDetailsView';

interface TableTreeProps {
  tables: Table[];
  connectionId: number;
}

const TableTree: React.FC<TableTreeProps> = ({ tables, connectionId }) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [tableColumns, setTableColumns] = useState<Record<string, Column[]>>({});
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Helper function to shorten PostgreSQL type names
  const formatColumnType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'timestamp with time zone': 'timestamptz',
      'timestamp without time zone': 'timestamp',
      'time with time zone': 'timetz',
      'time without time zone': 'time',
      'character varying': 'varchar',
      'double precision': 'float8',
    };
    return typeMap[type.toLowerCase()] || type;
  };

  const toggleTable = async (tableName: string) => {
    const newExpanded = new Set(expandedTables);

    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);

      // Load columns if not already loaded
      if (!tableColumns[tableName]) {
        setLoadingColumns(new Set(loadingColumns).add(tableName));
        try {
          const response = await databaseAPI.getColumns(connectionId, tableName);
          setTableColumns({ ...tableColumns, [tableName]: response.data });
        } catch (error) {
          console.error('Failed to load columns:', error);
        } finally {
          const newLoading = new Set(loadingColumns);
          newLoading.delete(tableName);
          setLoadingColumns(newLoading);
        }
      }
    }

    setExpandedTables(newExpanded);
  };

  return (
    <>
      <div className="py-1">
        {tables.map((table) => (
          <div key={table.name} className="mb-0.5">
            <div className="flex items-center group">
              <button
                onClick={() => toggleTable(table.name)}
                className="flex-1 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2"
              >
                <span className="text-xs">
                  {expandedTables.has(table.name) ? '▼' : '▶'}
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                  {table.name}
                </span>
                {table.schema && table.schema !== 'public' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({table.schema})
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedTable(table.name)}
                className="px-2 py-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs transition"
                title="View Details"
              >
                ℹ️
              </button>
            </div>

          {expandedTables.has(table.name) && (
            <div className="ml-6 border-l border-gray-200 dark:border-gray-700">
              {loadingColumns.has(table.name) ? (
                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : tableColumns[table.name] ? (
                tableColumns[table.name].map((column) => (
                  <div
                    key={column.name}
                    className="px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {column.is_primary_key && (
                          <span className="text-xs flex-shrink-0" title="Primary Key">🔑</span>
                        )}
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                          {column.name}
                        </span>
                        {column.is_nullable === 'NO' && (
                          <span className="text-xs text-red-500 flex-shrink-0" title="Not Null">*</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {formatColumnType(column.type)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-1 text-xs text-red-500">
                  Failed to load columns
                </div>
              )}
            </div>
          )}
          </div>
        ))}
      </div>

      {selectedTable && (
        <TableDetailsView
          connectionId={connectionId}
          tableName={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </>
  );
};

export default TableTree;

