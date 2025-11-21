import React, { useState } from 'react';
import { QueryTab } from '../../types';

interface TabBarProps {
  tabs: QueryTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onRenameTab: (tabId: string, newName: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onAddTab,
  onCloseTab,
  onRenameTab,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleDoubleClick = (tab: QueryTab) => {
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  const handleRename = (tabId: string) => {
    if (editingName.trim()) {
      onRenameTab(tabId, editingName.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1 flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer group ${
              tab.id === activeTabId
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRename(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(tab.id);
                  if (e.key === 'Escape') setEditingTabId(null);
                }}
                className="text-sm px-1 py-0 bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="text-sm"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(tab);
                }}
              >
                {tab.name}
              </span>
            )}

            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded px-1 transition"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onAddTab}
        className="px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        title="New Tab (Cmd+T)"
      >
        +
      </button>
    </div>
  );
};

export default TabBar;

