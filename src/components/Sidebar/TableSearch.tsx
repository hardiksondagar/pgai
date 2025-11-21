import React from 'react';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const TableSearch: React.FC<TableSearchProps> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      placeholder="Search tables..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
    />
  );
};

export default TableSearch;

