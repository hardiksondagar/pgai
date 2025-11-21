-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 5432,
  database TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  ssl_enabled BOOLEAN DEFAULT 0,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP
);

-- Query history
CREATE TABLE IF NOT EXISTS query_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER,
  query TEXT NOT NULL,
  execution_time REAL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- Favorite queries
CREATE TABLE IF NOT EXISTS favorite_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  query TEXT NOT NULL,
  folder TEXT,
  connection_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER,
  user_prompt TEXT NOT NULL,
  generated_sql TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Query tabs state
CREATE TABLE IF NOT EXISTS query_tabs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER,
  name TEXT NOT NULL,
  content TEXT,
  position INTEGER,
  FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- Schema cache for database connections
CREATE TABLE IF NOT EXISTS schema_cache (
  connection_id INTEGER PRIMARY KEY,
  schema_data TEXT NOT NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

