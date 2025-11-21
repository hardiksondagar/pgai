import React, { useState, useEffect } from 'react';
import { Settings } from '../../types';
import { settingsAPI } from '../../services/api';

interface SettingsModalProps {
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  theme,
  onThemeChange,
}) => {
  const [settings, setSettings] = useState<Settings>({
    openai_model: 'gpt-4o-mini',
    font_size: 14,
    tab_size: 2,
    auto_complete_enabled: true,
    default_query_limit: 100,
  });
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updateData: any = { ...settings };
      if (apiKey) {
        updateData.openai_api_key = apiKey;
      }

      await settingsAPI.update(updateData);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setApiKey('');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Settings
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Settings */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
              AI Settings
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OpenAI API Key
                  {settings.openai_api_key_set && (
                    <span className="ml-2 text-green-600 text-xs">✓ Set</span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={settings.openai_api_key_set ? 'Enter new key to update' : 'Enter your OpenAI API key'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={settings.openai_model}
                  onChange={(e) => setSettings({ ...settings, openai_model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <optgroup label="GPT-5 Series (Latest)">
                    <option value="gpt-5.1">GPT-5.1 (Latest, Most Advanced)</option>
                    <option value="gpt-5">GPT-5 (Advanced)</option>
                    <option value="gpt-5-mini">GPT-5 Mini (Fast & Efficient)</option>
                    <option value="gpt-5-nano">GPT-5 Nano (Ultra Fast, Budget)</option>
                    <option value="gpt-5.1-codex">GPT-5.1 Codex (Code Optimized)</option>
                    <option value="gpt-5-codex">GPT-5 Codex (Code Optimized)</option>
                  </optgroup>
                  <optgroup label="GPT-4 Series">
                    <option value="gpt-4.1">GPT-4.1 (Advanced)</option>
                    <option value="gpt-4o">GPT-4o (Capable)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast, Affordable)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Editor Settings */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Editor Settings
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Font Size: {settings.font_size}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={settings.font_size}
                  onChange={(e) => setSettings({ ...settings, font_size: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tab Size: {settings.tab_size} spaces
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="2"
                  value={settings.tab_size}
                  onChange={(e) => setSettings({ ...settings, tab_size: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.auto_complete_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_complete_enabled: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Auto-complete
                </span>
              </label>
            </div>
          </div>

          {/* General Settings */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
              General Settings
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => onThemeChange(e.target.value as 'light' | 'dark')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Query Limit
                </label>
                <input
                  type="number"
                  value={settings.default_query_limit}
                  onChange={(e) =>
                    setSettings({ ...settings, default_query_limit: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

