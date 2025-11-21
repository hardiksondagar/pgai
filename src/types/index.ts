export interface Connection {
  id?: number;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl_enabled?: boolean;
  color?: string;
  created_at?: string;
  last_used?: string;
}

export interface Table {
  schema: string;
  name: string;
  type: string;
}

export interface Column {
  name: string;
  type: string;
  is_nullable: string;
  default_value: string | null;
  max_length: number | null;
  is_primary_key?: boolean;
}

export interface Index {
  name: string;
  definition: string;
}

export interface Relation {
  constraint_name: string;
  column_name: string;
  foreign_table_name?: string;
  foreign_column_name?: string;
  table_name?: string;
  referenced_column_name?: string;
}

export interface QueryResult {
  success: boolean;
  columns?: string[];
  rows?: any[];
  row_count?: number;
  execution_time?: number;
  error?: string;
  message?: string;
}

export interface QueryHistory {
  id: number;
  connection_id: number;
  query: string;
  execution_time: number;
  executed_at: string;
}

export interface FavoriteQuery {
  id?: number;
  name: string;
  description?: string;
  query: string;
  folder?: string;
  connection_id?: number;
  created_at?: string;
}

export interface AIConversation {
  id: number;
  connection_id: number;
  user_prompt: string;
  generated_sql: string;
  created_at: string;
}

export interface QueryTab {
  id: string;
  name: string;
  content: string;
  result?: QueryResult;
  isExecuting?: boolean;
}

export interface Settings {
  openai_api_key?: string;
  openai_api_key_set?: boolean;
  openai_model?: string;
  theme?: 'light' | 'dark' | 'auto';
  font_size?: number;
  tab_size?: number;
  auto_complete_enabled?: boolean;
  default_query_limit?: number;
}

export interface AutoCompleteData {
  tables: string[];
  columns: Record<string, string[]>;
  keywords: string[];
}

