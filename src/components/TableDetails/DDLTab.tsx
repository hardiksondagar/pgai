import React, { useState } from 'react';

interface DDLTabProps {
  ddl: string;
}

const DDLTab: React.FC<DDLTabProps> = ({ ddl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ddl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          CREATE TABLE Statement
        </h3>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-sm rounded transition ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm text-gray-800 dark:text-gray-200 font-mono">
        {ddl}
      </pre>
    </div>
  );
};

export default DDLTab;

