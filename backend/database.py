import sqlite3
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
from encryption import encryption

class Database:
    def __init__(self):
        self.db_path = Path.home() / '.pgai' / 'pgai.db'
        self.db_path.parent.mkdir(exist_ok=True)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize database with schema"""
        conn = self.get_connection()
        with open(Path(__file__).parent / 'schema.sql', 'r') as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()

    # Connection methods
    def save_connection(self, data: Dict[str, Any]) -> int:
        """Save a new connection"""
        conn = self.get_connection()
        cursor = conn.cursor()

        encrypted_password = encryption.encrypt(data['password'])

        cursor.execute('''
            INSERT INTO connections (name, host, port, database, username, password, ssl_enabled, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data['host'],
            data.get('port', 5432),
            data['database'],
            data['username'],
            encrypted_password,
            data.get('ssl_enabled', False),
            data.get('color', '#3b82f6')
        ))

        conn.commit()
        connection_id = cursor.lastrowid
        conn.close()
        return connection_id

    def get_connections(self) -> List[Dict[str, Any]]:
        """Get all connections"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM connections ORDER BY last_used DESC, created_at DESC')
        rows = cursor.fetchall()
        conn.close()

        connections = []
        for row in rows:
            conn_dict = dict(row)
            conn_dict['password'] = encryption.decrypt(conn_dict['password'])
            connections.append(conn_dict)

        return connections

    def get_connection_by_id(self, connection_id: int) -> Optional[Dict[str, Any]]:
        """Get connection by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM connections WHERE id = ?', (connection_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            conn_dict = dict(row)
            conn_dict['password'] = encryption.decrypt(conn_dict['password'])
            return conn_dict
        return None

    def update_connection(self, connection_id: int, data: Dict[str, Any]) -> bool:
        """Update connection"""
        conn = self.get_connection()
        cursor = conn.cursor()

        encrypted_password = encryption.encrypt(data['password'])

        cursor.execute('''
            UPDATE connections
            SET name = ?, host = ?, port = ?, database = ?, username = ?,
                password = ?, ssl_enabled = ?, color = ?
            WHERE id = ?
        ''', (
            data['name'],
            data['host'],
            data.get('port', 5432),
            data['database'],
            data['username'],
            encrypted_password,
            data.get('ssl_enabled', False),
            data.get('color', '#3b82f6'),
            connection_id
        ))

        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    def delete_connection(self, connection_id: int) -> bool:
        """Delete connection"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM connections WHERE id = ?', (connection_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    def update_last_used(self, connection_id: int):
        """Update last_used timestamp"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE connections SET last_used = ? WHERE id = ?',
                      (datetime.now(), connection_id))
        conn.commit()
        conn.close()

    # Query history methods
    def save_query_history(self, connection_id: int, query: str, execution_time: float):
        """Save query to history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO query_history (connection_id, query, execution_time)
            VALUES (?, ?, ?)
        ''', (connection_id, query, execution_time))
        conn.commit()
        conn.close()

    def get_query_history(self, connection_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get query history for connection"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM query_history
            WHERE connection_id = ?
            ORDER BY executed_at DESC
            LIMIT ?
        ''', (connection_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_slow_queries(self, connection_id: int, min_execution_time: float = 1.0, limit: int = 50) -> List[Dict[str, Any]]:
        """Get slow queries filtered by minimum execution time"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM query_history
            WHERE connection_id = ?
            AND execution_time >= ?
            ORDER BY execution_time DESC
            LIMIT ?
        ''', (connection_id, min_execution_time, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def delete_query_history(self, history_id: int) -> bool:
        """Delete query history item"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM query_history WHERE id = ?', (history_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    # Favorite queries methods
    def save_favorite(self, data: Dict[str, Any]) -> int:
        """Save favorite query"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO favorite_queries (name, description, query, folder, connection_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['name'], data.get('description', ''), data['query'],
              data.get('folder', ''), data.get('connection_id')))
        conn.commit()
        favorite_id = cursor.lastrowid
        conn.close()
        return favorite_id

    def get_favorites(self) -> List[Dict[str, Any]]:
        """Get all favorite queries"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM favorite_queries ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def update_favorite(self, favorite_id: int, data: Dict[str, Any]) -> bool:
        """Update favorite query"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE favorite_queries
            SET name = ?, description = ?, query = ?, folder = ?
            WHERE id = ?
        ''', (data['name'], data.get('description', ''), data['query'],
              data.get('folder', ''), favorite_id))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    def delete_favorite(self, favorite_id: int) -> bool:
        """Delete favorite query"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM favorite_queries WHERE id = ?', (favorite_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    # AI conversations methods
    def save_ai_conversation(self, connection_id: int, user_prompt: str, generated_sql: str):
        """Save AI conversation"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO ai_conversations (connection_id, user_prompt, generated_sql)
            VALUES (?, ?, ?)
        ''', (connection_id, user_prompt, generated_sql))
        conn.commit()
        conn.close()

    def get_ai_conversations(self, connection_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        """Get AI conversations for connection"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM ai_conversations
            WHERE connection_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (connection_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def delete_ai_conversation(self, conversation_id: int) -> bool:
        """Delete AI conversation"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM ai_conversations WHERE id = ?', (conversation_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    # Settings methods
    def get_setting(self, key: str) -> Optional[str]:
        """Get setting value"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT value FROM settings WHERE key = ?', (key,))
        row = cursor.fetchone()
        conn.close()
        return row['value'] if row else None

    def get_all_settings(self) -> Dict[str, str]:
        """Get all settings"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT key, value FROM settings')
        rows = cursor.fetchall()
        conn.close()
        return {row['key']: row['value'] for row in rows}

    def save_setting(self, key: str, value: str):
        """Save or update setting"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        ''', (key, value))
        conn.commit()
        conn.close()

    # Query tabs methods
    def save_tab(self, data: Dict[str, Any]) -> int:
        """Save query tab state"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO query_tabs (connection_id, name, content, position)
            VALUES (?, ?, ?, ?)
        ''', (data['connection_id'], data['name'], data.get('content', ''),
              data.get('position', 0)))
        conn.commit()
        tab_id = cursor.lastrowid
        conn.close()
        return tab_id

    def get_tabs(self, connection_id: int) -> List[Dict[str, Any]]:
        """Get saved tabs for connection"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM query_tabs
            WHERE connection_id = ?
            ORDER BY position
        ''', (connection_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def delete_tab(self, tab_id: int) -> bool:
        """Delete tab"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM query_tabs WHERE id = ?', (tab_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    # Schema cache methods
    def save_schema_cache(self, connection_id: int, schema_data: Dict[str, Any]):
        """Cache schema for a connection"""
        conn = self.get_connection()
        cursor = conn.cursor()
        schema_json = json.dumps(schema_data)
        cursor.execute('''
            INSERT OR REPLACE INTO schema_cache (connection_id, schema_data, cached_at)
            VALUES (?, ?, ?)
        ''', (connection_id, schema_json, datetime.now()))
        conn.commit()
        conn.close()

    def get_schema_cache(self, connection_id: int) -> Optional[Dict[str, Any]]:
        """Get cached schema for a connection"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT schema_data, cached_at FROM schema_cache WHERE connection_id = ?
        ''', (connection_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                'schema': json.loads(row['schema_data']),
                'cached_at': row['cached_at']
            }
        return None

    def delete_schema_cache(self, connection_id: int) -> bool:
        """Delete cached schema for a connection"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM schema_cache WHERE connection_id = ?', (connection_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

# Global database instance
db = Database()

