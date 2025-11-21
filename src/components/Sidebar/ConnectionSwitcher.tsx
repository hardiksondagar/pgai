import React, { useState } from 'react';
import { Connection } from '../../types';

interface ConnectionSwitcherProps {
  connections: Connection[];
  currentConnection: Connection | null;
  onConnectionChange: (connection: Connection) => void;
  onNewConnection: () => void;
  onEditConnection: (connection: Connection) => void;
  onDeleteConnection: (id: number) => void;
}

const ConnectionSwitcher: React.FC<ConnectionSwitcherProps> = ({
  connections,
  currentConnection,
  onConnectionChange,
  onNewConnection,
  onEditConnection,
  onDeleteConnection,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {currentConnection ? currentConnection.name : 'Select Connection'}
        </span>
        <span className="text-xs">▼</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => {
                  onNewConnection();
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              >
                + New Connection
              </button>
            </div>

            {connections.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                  >
                    <button
                      onClick={() => {
                        onConnectionChange(conn);
                        setShowDropdown(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: conn.color || '#3b82f6' }}
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                          {conn.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                        {conn.host}:{conn.port}/{conn.database}
                      </div>
                    </button>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditConnection(conn);
                          setShowDropdown(false);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete connection "${conn.name}"?`)) {
                            onDeleteConnection(conn.id!);
                          }
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-xs"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionSwitcher;

