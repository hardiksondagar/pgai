import axios from 'axios';
import type {
  Connection,
  Table,
  Column,
  Index,
  Relation,
  QueryResult,
  QueryHistory,
  FavoriteQuery,
  AIConversation,
  Settings,
  AutoCompleteData,
} from '../types';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Connection Management
export const connectionAPI = {
  getAll: () => api.get<Connection[]>('/connections'),
  getById: (id: number) => api.get<Connection>(`/connections/${id}`),
  create: (data: Connection) => api.post('/connections', data),
  update: (id: number, data: Connection) => api.put(`/connections/${id}`, data),
  delete: (id: number) => api.delete(`/connections/${id}`),
  test: (id: number) => api.post<{ success: boolean; message: string }>(`/connections/${id}/test`),
};

// Database Exploration
export const databaseAPI = {
  getTables: (connectionId: number) => api.get<Table[]>(`/connections/${connectionId}/tables`),
  getColumns: (connectionId: number, tableName: string) =>
    api.get<Column[]>(`/connections/${connectionId}/tables/${tableName}/columns`),
  getIndexes: (connectionId: number, tableName: string) =>
    api.get<Index[]>(`/connections/${connectionId}/tables/${tableName}/indexes`),
  getRelations: (connectionId: number, tableName: string) =>
    api.get<{ outgoing: Relation[]; incoming: Relation[] }>(
      `/connections/${connectionId}/tables/${tableName}/relations`
    ),
  getDDL: (connectionId: number, tableName: string) =>
    api.get<{ ddl: string }>(`/connections/${connectionId}/tables/${tableName}/ddl`),
  getStats: (connectionId: number, tableName: string) =>
    api.get<{ row_count: number; size: string }>(`/connections/${connectionId}/tables/${tableName}/stats`),
  getAutocomplete: (connectionId: number) =>
    api.get<AutoCompleteData>(`/connections/${connectionId}/autocomplete`),
  refreshSchema: (connectionId: number) =>
    api.post<{ success: boolean; message: string; table_count: number }>(
      `/connections/${connectionId}/refresh-schema`
    ),
};

// Query Execution
export const queryAPI = {
  execute: (connectionId: number, query: string, limit?: number) =>
    api.post<QueryResult>(`/connections/${connectionId}/query`, { query, limit }),
  format: (connectionId: number, query: string) =>
    api.post<{ formatted: string }>(`/connections/${connectionId}/format-sql`, { query }),
};

// AI Features
export const aiAPI = {
  generateSQL: (prompt: string, connectionId?: number) =>
    api.post<{ success: boolean; sql?: string; error?: string }>('/ai/generate-sql', {
      prompt,
      connection_id: connectionId,
    }),
  getConversations: (connectionId: number) =>
    api.get<AIConversation[]>(`/ai/conversations/${connectionId}`),
  deleteConversation: (conversationId: number) => api.delete(`/ai/conversations/${conversationId}`),
};

// Query History
export const historyAPI = {
  get: (connectionId: number) => api.get<QueryHistory[]>(`/history/${connectionId}`),
  delete: (historyId: number) => api.delete(`/history/${historyId}`),
};

// Favorites
export const favoritesAPI = {
  getAll: () => api.get<FavoriteQuery[]>('/favorites'),
  create: (data: FavoriteQuery) => api.post('/favorites', data),
  update: (id: number, data: FavoriteQuery) => api.put(`/favorites/${id}`, data),
  delete: (id: number) => api.delete(`/favorites/${id}`),
};

// Settings
export const settingsAPI = {
  get: () => api.get<Settings>('/settings'),
  update: (data: Partial<Settings>) => api.put('/settings', data),
};

export default api;

