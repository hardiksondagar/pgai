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
  getHealth: (connectionId: number) =>
    api.get<{
      success: boolean;
      bloat: any;
      indexes: any;
      cache: any;
      ai_analysis: {
        success: boolean;
        health_score: number;
        grade: string;
        critical_issues: any[];
        action_items: Array<{
          priority: string;
          title: string;
          description: string;
          fix_sql?: string;
          impact: string;
        }>;
        summary: string;
      };
    }>(`/connections/${connectionId}/health`),
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
  explainQuery: (query: string, connectionId?: number) =>
    api.post<{ success: boolean; explanation?: string; error?: string }>('/ai/explain-query', {
      query,
      connection_id: connectionId,
    }),
  debugQuery: (query: string, error: string, connectionId?: number) =>
    api.post<{ success: boolean; fixed_query?: string; explanation?: string; error?: string }>(
      '/ai/debug-query',
      {
        query,
        error,
        connection_id: connectionId,
      }
    ),
  optimizeQuery: (query: string, connectionId?: number, executionTime?: number) =>
    api.post<{
      success: boolean;
      original_query?: string;
      optimized_query?: string;
      suggestions?: string[];
      explanation?: string;
      error?: string;
    }>('/ai/optimize-query', {
      query,
      connection_id: connectionId,
      execution_time: executionTime,
    }),
  analyzeExplain: (query: string, connectionId: number) =>
    api.post<{
      success: boolean;
      insights?: string[];
      bottlenecks?: string[];
      recommendations?: string[];
      summary?: string;
      plan_text?: string;
      plan_json?: any;
      error?: string;
    }>('/ai/analyze-explain', {
      query,
      connection_id: connectionId,
    }),
  suggestIndexes: (connectionId: number) =>
    api.post<{
      success: boolean;
      recommendations?: Array<{
        table?: string;
        columns?: string[];
        reason?: string;
        create_statement?: string;
      }>;
      analyzed_queries?: number;
      error?: string;
    }>('/ai/suggest-indexes', {
      connection_id: connectionId,
    }),
  analyzeSlowQueries: (connectionId: number, queries: any[]) =>
    api.post<{
      success: boolean;
      analyses?: Array<{
        query_number: number;
        issues: string[];
        recommendations: string[];
        indexes: string[];
        estimated_improvement: string;
      }>;
      summary?: string;
      query_count?: number;
      error?: string;
    }>('/ai/analyze-slow-queries', {
      connection_id: connectionId,
      queries: queries,
    }),
};

// Query History
export const historyAPI = {
  get: (connectionId: number) => api.get<QueryHistory[]>(`/history/${connectionId}`),
  delete: (historyId: number) => api.delete(`/history/${historyId}`),
  getSlowQueries: (connectionId: number, minTime: number = 1.0, limit: number = 50, source: string = 'auto') =>
    api.get<{
      queries: QueryHistory[];
      source: string;
      sources_available: string[];
    }>(`/connections/${connectionId}/slow-queries?min_time=${minTime}&limit=${limit}&source=${source}`),
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

