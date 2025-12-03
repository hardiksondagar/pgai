import React, { useState } from 'react';
import { QueryResult } from '../../types';

interface ResultsGridProps {
  result: QueryResult;
  onDebugQuery?: () => void;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ result, onDebugQuery }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  // Helper to format cell values (especially JSON)
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // Helper to render cell content
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

  if (!result.success) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded m-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-red-800 dark:text-red-200 font-semibold">Error</h3>
          {onDebugQuery && (
            <button
              onClick={onDebugQuery}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition flex items-center gap-1"
            >
              🔧 AI Debug
            </button>
          )}
        </div>
        <pre className="text-red-700 dark:text-red-300 text-sm whitespace-pre-wrap">
          {result.error}
        </pre>
      </div>
    );
  }

  if (result.message && !result.columns?.length) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded m-4">
        <p className="text-green-800 dark:text-green-200">{result.message}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Execution time: {result.execution_time}s
        </p>
      </div>
    );
  }

  if (!result.columns || result.columns.length === 0) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400">
        No results to display
      </div>
    );
  }

  const totalPages = Math.ceil((result.rows?.length || 0) / pageSize);
  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const currentRows = result.rows?.slice(startIdx, endIdx) || [];

  const handleCopyCell = (value: any) => {
    navigator.clipboard.writeText(formatCellValue(value));
  };

  const handleCopyRow = (row: any) => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
  };

  const handleExportCSV = () => {
    if (!result.columns || !result.rows) return;

    const csv = [
      result.columns.join(','),
      ...result.rows.map(row =>
        result.columns!.map(col => {
          const val = row[col];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{result.row_count} rows</span>
          <span>•</span>
          <span>{result.execution_time}s</span>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                #
              </th>
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
            {currentRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {startIdx + rowIdx + 1}
                </td>
                {result.columns!.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => handleCopyCell(row[col])}
                    title="Click to copy"
                  >
                    {renderCellContent(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
            className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
          >
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={500}>500 rows</option>
            <option value={1000}>1000 rows</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default ResultsGrid;

