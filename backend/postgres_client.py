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

    def execute_explain_analyze(self, conn_data: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Execute EXPLAIN ANALYZE on a query and return the plan"""
        connection_id = conn_data['id']

        try:
            conn_pool = self.get_pool(connection_id, conn_data)
            conn = conn_pool.getconn()

            try:
                cursor = conn.cursor(cursor_factory=RealDictCursor)

                # Wrap query with EXPLAIN ANALYZE
                explain_query = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}"
                cursor.execute(explain_query)

                result = cursor.fetchall()

                # Extract the JSON plan
                if result and len(result) > 0:
                    plan = result[0].get('QUERY PLAN', [])

                    # Also get text format for AI analysis
                    cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS) {query}")
                    text_result = cursor.fetchall()
                    text_plan = '\n'.join([row.get('QUERY PLAN', '') for row in text_result])

                    return {
                        'success': True,
                        'plan_json': plan,
                        'plan_text': text_plan
                    }
                else:
                    return {
                        'success': False,
                        'error': 'No execution plan returned'
                    }

            finally:
                conn_pool.putconn(conn)

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_all_indexes(self, conn_data: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
        """Get all indexes for all tables"""
        tables = self.get_tables(conn_data)
        all_indexes = {}

        for table in tables:
            table_name = table['name']
            indexes = self.get_table_indexes(conn_data, table_name)
            all_indexes[table_name] = indexes

        return all_indexes

    def get_slow_queries_from_pg_stat(self, conn_data: Dict[str, Any], min_execution_time: float = 1.0, limit: int = 50) -> Dict[str, Any]:
        """Get slow queries from pg_stat_statements extension"""
        connection_id = conn_data['id']

        try:
            conn_pool = self.get_pool(connection_id, conn_data)
            conn = conn_pool.getconn()

            try:
                cursor = conn.cursor(cursor_factory=RealDictCursor)

                # First check if pg_stat_statements is available
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
                    ) as has_extension
                """)
                result = cursor.fetchone()

                if not result or not result['has_extension']:
                    return {
                        'success': False,
                        'error': 'pg_stat_statements extension is not installed',
                        'queries': []
                    }

                # Get slow queries from pg_stat_statements
                # Filter by mean_exec_time (in milliseconds)
                min_time_ms = min_execution_time * 1000

                query = """
                    SELECT
                        query,
                        calls,
                        total_exec_time / 1000 as total_time_seconds,
                        mean_exec_time / 1000 as mean_time_seconds,
                        max_exec_time / 1000 as max_time_seconds,
                        min_exec_time / 1000 as min_time_seconds,
                        stddev_exec_time / 1000 as stddev_time_seconds,
                        rows as total_rows
                    FROM pg_stat_statements
                    WHERE mean_exec_time >= %s
                    AND query NOT LIKE '%%pg_stat_statements%%'
                    AND query NOT LIKE '%%pg_catalog%%'
                    ORDER BY mean_exec_time DESC
                    LIMIT %s
                """

                cursor.execute(query, (min_time_ms, limit))
                queries = cursor.fetchall()

                return {
                    'success': True,
                    'queries': [dict(q) for q in queries],
                    'source': 'pg_stat_statements'
                }

            finally:
                conn_pool.putconn(conn)

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'queries': []
            }

    def get_currently_running_queries(self, conn_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get currently running queries from pg_stat_activity"""
        connection_id = conn_data['id']

        try:
            conn_pool = self.get_pool(connection_id, conn_data)
            conn = conn_pool.getconn()

            try:
                cursor = conn.cursor(cursor_factory=RealDictCursor)

                query = """
                    SELECT
                        pid,
                        usename as username,
                        application_name,
                        client_addr,
                        query_start,
                        state,
                        query,
                        EXTRACT(EPOCH FROM (now() - query_start)) as duration_seconds
                    FROM pg_stat_activity
                    WHERE state = 'active'
                    AND query NOT LIKE '%%pg_stat_activity%%'
                    AND pid != pg_backend_pid()
                    ORDER BY query_start ASC
                """

                cursor.execute(query)
                queries = cursor.fetchall()

                return {
                    'success': True,
                    'queries': [dict(q) for q in queries]
                }

            finally:
                conn_pool.putconn(conn)

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'queries': []
            }

    def get_table_bloat_analysis(self, conn_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze table bloat and vacuum statistics"""
        connection_id = conn_data['id']

        try:
            conn_pool = self.get_pool(connection_id, conn_data)
            conn = conn_pool.getconn()

            try:
                cursor = conn.cursor(cursor_factory=RealDictCursor)

                # Get bloat estimation and vacuum stats
                query = """
                    SELECT
                        schemaname,
                        relname as tablename,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
                        pg_total_relation_size(schemaname||'.'||relname) as total_bytes,
                        n_live_tup,
                        n_dead_tup,
                        CASE
                            WHEN n_live_tup > 0
                            THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
                            ELSE 0
                        END as bloat_percent,
                        last_vacuum,
                        last_autovacuum,
                        last_analyze,
                        last_autoanalyze,
                        vacuum_count,
                        autovacuum_count,
                        analyze_count,
                        autoanalyze_count
                    FROM pg_stat_user_tables
                    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                    ORDER BY total_bytes DESC
                """

                cursor.execute(query)
                tables = cursor.fetchall()

                return {
                    'success': True,
                    'tables': [dict(t) for t in tables]
                }

            finally:
                conn_pool.putconn(conn)

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'tables': []
            }

    def get_index_health_analysis(self, conn_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze index health: unused, duplicate, bloated"""
        connection_id = conn_data['id']

        try:
            conn_pool = self.get_pool(connection_id, conn_data)
            conn = conn_pool.getconn()

            try:
                cursor = conn.cursor(cursor_factory=RealDictCursor)

                # Get index usage statistics
                query = """
                    SELECT
                        schemaname,
                        relname as tablename,
                        indexrelname as indexname,
                        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
                        pg_relation_size(indexrelid) as index_bytes,
                        idx_scan,
                        idx_tup_read,
                        idx_tup_fetch
                    FROM pg_stat_user_indexes
                    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                    ORDER BY pg_relation_size(indexrelid) DESC
                """

                cursor.execute(query)
                indexes = cursor.fetchall()

                # Find duplicate indexes (indexes on same columns)
                duplicate_query = """
                    SELECT
                        array_agg(indexrelname) as duplicate_indexes,
                        relname as tablename,
                        string_agg(pg_get_indexdef(indexrelid), ' | ') as definitions
                    FROM pg_stat_user_indexes
                    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                    GROUP BY relname, pg_get_indexdef(indexrelid)
                    HAVING count(*) > 1
                """

                cursor.execute(duplicate_query)
                duplicates = cursor.fetchall()

                return {
                    'success': True,
                    'indexes': [dict(i) for i in indexes],
                    'duplicates': [dict(d) for d in duplicates]
                }

            finally:
                conn_pool.putconn(conn)

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'indexes': [],
                'duplicates': []
            }

    def get_cache_hit_ratio(self, conn_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get cache hit ratio and table access patterns"""
        connection_id = conn_data['id']

        try:
            conn_pool = self.get_pool(connection_id, conn_data)
            conn = conn_pool.getconn()

            try:
                cursor = conn.cursor(cursor_factory=RealDictCursor)

                # Overall cache hit ratio
                cache_query = """
                    SELECT
                        sum(heap_blks_read) as heap_read,
                        sum(heap_blks_hit) as heap_hit,
                        CASE
                            WHEN sum(heap_blks_hit) + sum(heap_blks_read) > 0
                            THEN round(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2)
                            ELSE 0
                        END as cache_hit_ratio
                    FROM pg_statio_user_tables
                """

                cursor.execute(cache_query)
                cache_stats = cursor.fetchone()

                # Per-table cache stats
                table_cache_query = """
                    SELECT
                        schemaname,
                        relname as tablename,
                        heap_blks_read,
                        heap_blks_hit,
                        CASE
                            WHEN heap_blks_hit + heap_blks_read > 0
                            THEN round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
                            ELSE 0
                        END as cache_hit_ratio,
                        idx_blks_read,
                        idx_blks_hit
                    FROM pg_statio_user_tables
                    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                    ORDER BY heap_blks_read + heap_blks_hit DESC
                    LIMIT 50
                """

                cursor.execute(table_cache_query)
                table_stats = cursor.fetchall()

                return {
                    'success': True,
                    'overall': dict(cache_stats) if cache_stats else {},
                    'tables': [dict(t) for t in table_stats]
                }

            finally:
                conn_pool.putconn(conn)

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'overall': {},
                'tables': []
            }

    def close_pool(self, connection_id: int):
        """Close connection pool"""
        if connection_id in self.connection_pools:
            self.connection_pools[connection_id].closeall()
            del self.connection_pools[connection_id]

# Global instance
pg_client = PostgresClient()

