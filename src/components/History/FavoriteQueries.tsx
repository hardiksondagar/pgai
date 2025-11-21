import React, { useState, useEffect } from 'react';
import { FavoriteQuery } from '../../types';
import { favoritesAPI } from '../../services/api';

interface FavoriteQueriesProps {
  connectionId?: number;
  onSelectQuery: (query: string) => void;
  onClose: () => void;
}

const FavoriteQueries: React.FC<FavoriteQueriesProps> = ({
  connectionId,
  onSelectQuery,
  onClose,
}) => {
  const [favorites, setFavorites] = useState<FavoriteQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteQuery | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    query: '',
    folder: '',
  });

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await favoritesAPI.getAll();
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        connection_id: connectionId,
      };

      if (editingFavorite) {
        await favoritesAPI.update(editingFavorite.id!, data);
      } else {
        await favoritesAPI.create(data);
      }

      loadFavorites();
      setShowAddModal(false);
      setEditingFavorite(null);
      setFormData({ name: '', description: '', query: '', folder: '' });
    } catch (error) {
      console.error('Failed to save favorite:', error);
    }
  };

  const handleEdit = (favorite: FavoriteQuery) => {
    setEditingFavorite(favorite);
    setFormData({
      name: favorite.name,
      description: favorite.description || '',
      query: favorite.query,
      folder: favorite.folder || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (favoriteId: number) => {
    if (!confirm('Delete this favorite query?')) return;

    try {
      await favoritesAPI.delete(favoriteId);
      setFavorites(favorites.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Failed to delete favorite:', error);
    }
  };

  const groupedFavorites = favorites.reduce((acc, fav) => {
    const folder = fav.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(fav);
    return acc;
  }, {} as Record<string, FavoriteQuery[]>);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Favorite Queries
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + New
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : favorites.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No favorite queries yet. Click "+ New" to add one.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedFavorites).map(([folder, queries]) => (
                  <div key={folder}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      📁 {folder}
                    </h3>
                    <div className="space-y-2">
                      {queries.map((fav) => (
                        <div
                          key={fav.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-gray-200">
                                {fav.name}
                              </h4>
                              {fav.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {fav.description}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => onSelectQuery(fav.query)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Use
                              </button>
                              <button
                                onClick={() => handleEdit(fav)}
                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(fav.id!)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            {fav.query}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {editingFavorite ? 'Edit' : 'Add'} Favorite Query
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="e.g., Get Active Users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Folder
                </label>
                <input
                  type="text"
                  value={formData.folder}
                  onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="e.g., Reports, Analytics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Query *
                </label>
                <textarea
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm"
                  rows={8}
                  placeholder="SELECT * FROM users WHERE ..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingFavorite(null);
                  setFormData({ name: '', description: '', query: '', folder: '' });
                }}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.query}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FavoriteQueries;

