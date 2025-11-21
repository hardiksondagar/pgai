import React, { useState, useEffect } from 'react';
import { QueryResult } from '../../types';
import { queryAPI } from '../../services/api';

interface DataTabProps {
  connectionId: number;
  tableName: string;
}

const DataTab: React.FC<DataTabProps> = ({ connectionId, tableName }) => {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to render cell content (especially JSON)
  const renderCellContent = (value: any) => {
    if (value === null) {
      return <span className="text-gray-400 italic">NULL</span>;
    }
    if (typeof value === 'object') {
      const jsonStr = JSON.stringify(value);
      const preview = jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
      return (
        <span className="font-mono text-xs text-blue-600 dark:text-blue-400" title="Click to copy full JSON">
          {preview}
        </span>
      );
    }
    const strValue = String(value);
    if (strValue.length > 100) {
      return (
        <span title={strValue}>
          {strValue.substring(0, 100)}...
        </span>
      );
    }
    return <span>{strValue}</span>;
  };

  useEffect(() => {
    loadData();
  }, [connectionId, tableName]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await queryAPI.execute(
        connectionId,
        `SELECT * FROM ${tableName}`,
        10
      );
      setResult(response.data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.response?.data?.error || 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  if (!result) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">No data</div>;
  }

  if (!result.success) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400">
        Error: {result.error}
      </div>
    );
  }

  if (!result.columns || result.columns.length === 0) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">No data found</div>;
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
          <tr>
            {result.columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows?.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            >
              {result.columns!.map((col) => (
                <td key={col} className="px-4 py-2 text-gray-800 dark:text-gray-200">
                  {renderCellContent(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows && result.rows.length >= 10 && (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Showing first 10 rows
        </div>
      )}
    </div>
  );
};

export default DataTab;

