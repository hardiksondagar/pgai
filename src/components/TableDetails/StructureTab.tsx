import React from 'react';
import { Column } from '../../types';

interface StructureTabProps {
  columns: Column[];
}

const StructureTab: React.FC<StructureTabProps> = ({ columns }) => {
  if (columns.length === 0) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        No columns found
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 dark:border-gray-600">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
              Column
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
              Type
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
              Nullable
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
              Default
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
              Constraints
            </th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => (
            <tr
              key={col.name}
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">
                {col.name}
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                {col.type}
                {col.max_length && `(${col.max_length})`}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    col.is_nullable === 'YES'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}
                >
                  {col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                {col.default_value || '-'}
              </td>
              <td className="py-3 px-4">
                {col.is_primary_key && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs mr-1">
                    PRIMARY KEY
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StructureTab;

