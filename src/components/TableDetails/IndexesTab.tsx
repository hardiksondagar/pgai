import React from 'react';
import { Index } from '../../types';

interface IndexesTabProps {
  indexes: Index[];
}

const IndexesTab: React.FC<IndexesTabProps> = ({ indexes }) => {
  if (indexes.length === 0) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        No indexes found
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 dark:border-gray-600">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
              Index Name
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
              Definition
            </th>
          </tr>
        </thead>
        <tbody>
          {indexes.map((index, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">
                {index.name}
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                {index.definition}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IndexesTab;

