import psycopg2
from psycopg2 import pool, sql
from psycopg2.extras import RealDictCursor
from typing import Dict, List, Any, Optional, Tuple
import time

class PostgresClient:
    def __init__(self):
        self.connection_pools = {}

    def get_connection_string(self, conn_data: Dict[str, Any]) -> str:
        """Build PostgreSQL connection string"""
        ssl_mode = 'require' if conn_data.get('ssl_enabled') else 'prefer'
        return f"host={conn_data['host']} port={conn_data['port']} dbname={conn_data['database']} " \
               f"user={conn_data['username']} password={conn_data['password']} sslmode={ssl_mode}"

    def test_connection(self, conn_data: Dict[str, Any]) -> Tuple[bool, str]:
        """Test PostgreSQL connection"""
        try:
            conn_string = self.get_connection_string(conn_data)
            conn = psycopg2.connect(conn_string, connect_timeout=5)
            conn.close()
            return True, "Connection successful"
        except Exception as e:
            return False, str(e)

    def get_pool(self, connection_id: int, conn_data: Dict[str, Any]):
        """Get or create connection pool for a connection"""
        if connection_id not in self.connection_pools:
            conn_string = self.get_connection_string(conn_data)
            self.connection_pools[connection_id] = pool.SimpleConnectionPool(
                1, 10, conn_string
            )
        return self.connection_pools[connection_id]

    def execute_query(self, conn_data: Dict[str, Any], query: str, limit: Optional[int] = None) -> Dict[str, Any]:
        """Execute SQL query and return results"""
        connection_id = conn_data['id']
        start_time = time.time()

        try:
            conn_pool = self.get_pool(connection_id, conn_data)
            conn = conn_pool.getconn()

            try:
                cursor = conn.cursor(cursor_factory=RealDictCursor)

                # Apply limit if provided
                if limit and 'limit' not in query.lower():
                    query = f"{query.rstrip(';')} LIMIT {limit}"

                cursor.execute(query)

                # Check if query returns rows (SELECT, etc.)
                if cursor.description:
                    columns = [desc[0] for desc in cursor.description]
                    rows = cursor.fetchall()
                    rows_data = [dict(row) for row in rows]

                    execution_time = time.time() - start_time

                    return {
                        'success': True,
                        'columns': columns,
                        'rows': rows_data,
                        'row_count': len(rows_data),
                        'execution_time': round(execution_time, 3)
                    }
                else:
                    # For INSERT, UPDATE, DELETE, etc.
                    conn.commit()
                    execution_time = time.time() - start_time

                    return {
                        'success': True,
                        'columns': [],
                        'rows': [],
                        'row_count': cursor.rowcount,
                        'execution_time': round(execution_time, 3),
                        'message': f'{cursor.rowcount} rows affected'
                    }
            finally:
                conn_pool.putconn(conn)

        except Exception as e:
            execution_time = time.time() - start_time
            return {
                'success': False,
                'error': str(e),
                'execution_time': round(execution_time, 3)
            }

    def get_tables(self, conn_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get all tables in database"""
        query = """
            SELECT
                schemaname as schema,
                tablename as name,
                'table' as type
            FROM pg_catalog.pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename
        """
        result = self.execute_query(conn_data, query)
        return result.get('rows', [])

    def get_table_columns(self, conn_data: Dict[str, Any], table_name: str) -> List[Dict[str, Any]]:
        """Get columns for a table"""
        query = f"""
            SELECT
                column_name as name,
                data_type as type,
                is_nullable,
                column_default as default_value,
                character_maximum_length as max_length
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            ORDER BY ordinal_position
        """
        result = self.execute_query(conn_data, query)
        return result.get('rows', [])

    def get_primary_keys(self, conn_data: Dict[str, Any], table_name: str) -> List[str]:
        """Get primary key columns for a table"""
        query = f"""
            SELECT a.attname as column_name
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = '{table_name}'::regclass
            AND i.indisprimary
        """
        result = self.execute_query(conn_data, query)
        return [row['column_name'] for row in result.get('rows', [])]

    def get_table_indexes(self, conn_data: Dict[str, Any], table_name: str) -> List[Dict[str, Any]]:
        """Get indexes for a table"""
        query = f"""
            SELECT
                indexname as name,
                indexdef as definition
            FROM pg_indexes
            WHERE tablename = '{table_name}'
            ORDER BY indexname
        """
        result = self.execute_query(conn_data, query)
        return result.get('rows', [])

    def get_table_relations(self, conn_data: Dict[str, Any], table_name: str) -> Dict[str, List[Dict[str, Any]]]:
        """Get foreign key relations for a table"""
        # Outgoing foreign keys
        outgoing_query = f"""
            SELECT
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = '{table_name}'
        """

        # Incoming foreign keys
        incoming_query = f"""
            SELECT
                tc.table_name,
                tc.constraint_name,
                kcu.column_name,
                ccu.column_name AS referenced_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = '{table_name}'
        """

        outgoing = self.execute_query(conn_data, outgoing_query)
        incoming = self.execute_query(conn_data, incoming_query)

        return {
            'outgoing': outgoing.get('rows', []),
            'incoming': incoming.get('rows', [])
        }

    def get_table_ddl(self, conn_data: Dict[str, Any], table_name: str) -> str:
        """Get CREATE TABLE statement for a table (simplified version)"""
        columns = self.get_table_columns(conn_data, table_name)
        primary_keys = self.get_primary_keys(conn_data, table_name)

        ddl = f"CREATE TABLE {table_name} (\n"

        col_definitions = []
        for col in columns:
            col_def = f"  {col['name']} {col['type']}"
            if col['max_length']:
                col_def += f"({col['max_length']})"
            if col['is_nullable'] == 'NO':
                col_def += " NOT NULL"
            if col['default_value']:
                col_def += f" DEFAULT {col['default_value']}"
            col_definitions.append(col_def)

        if primary_keys:
            col_definitions.append(f"  PRIMARY KEY ({', '.join(primary_keys)})")

        ddl += ',\n'.join(col_definitions)
        ddl += "\n);"

        return ddl

    def get_table_stats(self, conn_data: Dict[str, Any], table_name: str) -> Dict[str, Any]:
        """Get statistics for a table"""
        query = f"""
            SELECT
                COUNT(*) as row_count
            FROM {table_name}
        """
        result = self.execute_query(conn_data, query)

        size_query = f"""
            SELECT pg_size_pretty(pg_total_relation_size('{table_name}'::regclass)) as size
        """
        size_result = self.execute_query(conn_data, size_query)

        return {
            'row_count': result['rows'][0]['row_count'] if result.get('rows') else 0,
            'size': size_result['rows'][0]['size'] if size_result.get('rows') else 'Unknown'
        }

    def get_autocomplete_data(self, conn_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get autocomplete data (tables, columns, keywords)"""
        tables = self.get_tables(conn_data)

        autocomplete_data = {
            'tables': [t['name'] for t in tables],
            'columns': {},
            'keywords': [
                'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
                'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
                'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
                'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
                'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW'
            ]
        }

        # Get columns for each table
        for table in tables:
            columns = self.get_table_columns(conn_data, table['name'])
            autocomplete_data['columns'][table['name']] = [c['name'] for c in columns]

        return autocomplete_data

    def close_pool(self, connection_id: int):
        """Close connection pool"""
        if connection_id in self.connection_pools:
            self.connection_pools[connection_id].closeall()
            del self.connection_pools[connection_id]

# Global instance
pg_client = PostgresClient()

