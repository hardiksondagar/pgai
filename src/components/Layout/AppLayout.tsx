import React, { useState, useEffect } from 'react';
import DatabaseExplorer from '../Sidebar/DatabaseExplorer';
import ConnectionSwitcher from '../Sidebar/ConnectionSwitcher';
import TabManager from '../QueryTabs/TabManager';
import ConnectionModal from '../Modals/ConnectionModal';
import SettingsModal from '../Modals/SettingsModal';
import AIPanel from '../AIAssistant/AIPanel';
import { Connection, QueryTab } from '../../types';
import { connectionAPI } from '../../services/api';

interface AppLayoutProps {
  currentConnection: Connection | null;
  onConnectionChange: (connection: Connection | null) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  currentConnection,
  onConnectionChange,
  theme,
  onThemeChange,
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [queryTabs, setQueryTabs] = useState<QueryTab[]>([
    { id: '1', name: 'Query 1', content: '' },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await connectionAPI.getAll();
      setConnections(response.data);

      // Auto-select first connection if none selected
      if (!currentConnection && response.data.length > 0) {
        onConnectionChange(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const handleSaveConnection = async (connection: Connection) => {
    try {
      if (connection.id) {
        await connectionAPI.update(connection.id, connection);
      } else {
        await connectionAPI.create(connection);
      }
      loadConnections();
      setShowConnectionModal(false);
      setEditingConnection(null);
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
  };

  const handleDeleteConnection = async (id: number) => {
    try {
      await connectionAPI.delete(id);
      if (currentConnection?.id === id) {
        onConnectionChange(null);
      }
      loadConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    setShowConnectionModal(true);
  };

  const handleNewConnection = () => {
    setEditingConnection(null);
    setShowConnectionModal(true);
  };

  const handleInsertSQL = (sql: string) => {
    const activeTab = queryTabs.find(t => t.id === activeTabId);
    if (activeTab) {
      const newTabs = queryTabs.map(tab =>
        tab.id === activeTabId
          ? { ...tab, content: tab.content ? tab.content + '\n\n' + sql : sql }
          : tab
      );
      setQueryTabs(newTabs);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">PG.AI</h1>
          </div>
          <ConnectionSwitcher
            connections={connections}
            currentConnection={currentConnection}
            onConnectionChange={onConnectionChange}
            onNewConnection={handleNewConnection}
            onEditConnection={handleEditConnection}
            onDeleteConnection={handleDeleteConnection}
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {currentConnection ? (
            <DatabaseExplorer connectionId={currentConnection.id!} />
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No connection selected</p>
              <button
                onClick={handleNewConnection}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Connection
              </button>
            </div>
          )}
        </div>

        {/* Main Area - Query Editor */}
        <div className="flex-1 flex overflow-hidden min-w-0">
          <div className="flex-1 flex flex-col overflow-hidden">
            <TabManager
              tabs={queryTabs}
              activeTabId={activeTabId}
              onTabChange={setActiveTabId}
              onTabsChange={setQueryTabs}
              connectionId={currentConnection?.id}
              theme={theme}
            />
          </div>

          {/* AI Panel - Always Visible, Never Hidden */}
          <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <AIPanel
              connectionId={currentConnection?.id}
              onInsertSQL={handleInsertSQL}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showConnectionModal && (
        <ConnectionModal
          connection={editingConnection}
          onSave={handleSaveConnection}
          onClose={() => {
            setShowConnectionModal(false);
            setEditingConnection(null);
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          theme={theme}
          onThemeChange={onThemeChange}
        />
      )}
    </div>
  );
};

export default AppLayout;

