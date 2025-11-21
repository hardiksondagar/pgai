import React from 'react';
import { QueryTab } from '../../types';
import TabBar from './TabBar';
import QueryTabComponent from './QueryTab';

interface TabManagerProps {
  tabs: QueryTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabsChange: (tabs: QueryTab[]) => void;
  connectionId?: number;
  theme?: 'light' | 'dark';
}

const TabManager: React.FC<TabManagerProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabsChange,
  connectionId,
  theme = 'dark',
}) => {
  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleAddTab = () => {
    const newTab: QueryTab = {
      id: `tab-${Date.now()}`,
      name: `Query ${tabs.length + 1}`,
      content: '',
    };
    onTabsChange([...tabs, newTab]);
    onTabChange(newTab.id);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) return; // Keep at least one tab

    const newTabs = tabs.filter(t => t.id !== tabId);
    onTabsChange(newTabs);

    if (activeTabId === tabId) {
      onTabChange(newTabs[0].id);
    }
  };

  const handleRenameTab = (tabId: string, newName: string) => {
    const newTabs = tabs.map(t =>
      t.id === tabId ? { ...t, name: newName } : t
    );
    onTabsChange(newTabs);
  };

  const handleContentChange = (content: string) => {
    if (!activeTab) return;

    const newTabs = tabs.map(t =>
      t.id === activeTabId ? { ...t, content } : t
    );
    onTabsChange(newTabs);
  };

  const handleResultChange = (result: any) => {
    if (!activeTab) return;

    const newTabs = tabs.map(t =>
      t.id === activeTabId ? { ...t, result } : t
    );
    onTabsChange(newTabs);
  };

  return (
    <div className="h-full flex flex-col">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onRenameTab={handleRenameTab}
      />

      {activeTab && connectionId ? (
        <QueryTabComponent
          tab={activeTab}
          connectionId={connectionId}
          onContentChange={handleContentChange}
          onResultChange={handleResultChange}
          theme={theme}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Select a connection to start querying</p>
        </div>
      )}
    </div>
  );
};

export default TabManager;

