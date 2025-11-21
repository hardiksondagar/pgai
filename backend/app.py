from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from database import db
from postgres_client import pg_client
from ai_service import ai_service
from sql_formatter import format_sql
import traceback

app = Flask(__name__)
# Allow all origins in development
CORS(app, resources={r"/*": {"origins": "*"}})

# Helper function to fetch and cache schema
def fetch_and_cache_schema(connection_id: int, conn_data: dict) -> dict:
    """Fetch schema from PostgreSQL and cache it in SQLite"""
    try:
        # Get tables
        tables = pg_client.get_tables(conn_data)

        # Build schema with full column details
        schema_data = {
            'tables': tables,
            'columns': {}
        }

        # Get detailed column info for each table (limit to first 50 tables for performance)
        for table in tables[:50]:
            try:
                columns = pg_client.get_table_columns(conn_data, table['name'])
                schema_data['columns'][table['name']] = columns
            except Exception as e:
                print(f"Warning: Failed to get columns for {table['name']}: {e}")
                schema_data['columns'][table['name']] = []

        # Cache the schema
        db.save_schema_cache(connection_id, schema_data)
        print(f"✅ Schema cached for connection {connection_id} with {len(tables)} tables")

        return schema_data
    except Exception as e:
        print(f"❌ Error fetching schema: {e}")
        traceback.print_exc()
        raise

# Health check
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# Connection Management
@app.route('/api/connections', methods=['GET'])
def get_connections():
    try:
        connections = db.get_connections()
        # Don't send passwords to frontend
        for conn in connections:
            conn.pop('password', None)
        return jsonify(connections)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections', methods=['POST'])
def create_connection():
    try:
        data = request.json
        connection_id = db.save_connection(data)
        return jsonify({'id': connection_id, 'message': 'Connection saved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>', methods=['GET'])
def get_connection(connection_id):
    try:
        conn = db.get_connection_by_id(connection_id)
        if conn:
            conn.pop('password', None)
            return jsonify(conn)
        return jsonify({'error': 'Connection not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>', methods=['PUT'])
def update_connection(connection_id):
    try:
        data = request.json
        success = db.update_connection(connection_id, data)
        if success:
            return jsonify({'message': 'Connection updated'})
        return jsonify({'error': 'Connection not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>', methods=['DELETE'])
def delete_connection(connection_id):
    try:
        success = db.delete_connection(connection_id)
        if success:
            pg_client.close_pool(connection_id)
            return jsonify({'message': 'Connection deleted'})
        return jsonify({'error': 'Connection not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/test', methods=['POST'])
def test_connection(connection_id):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        success, message = pg_client.test_connection(conn_data)

        # If connection is successful, fetch and cache schema
        if success:
            try:
                fetch_and_cache_schema(connection_id, conn_data)
            except Exception as e:
                print(f"Warning: Failed to cache schema: {e}")
                # Don't fail the test if schema caching fails

        return jsonify({'success': success, 'message': message})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Database Exploration
@app.route('/api/connections/<int:connection_id>/tables', methods=['GET'])
def get_tables(connection_id):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        db.update_last_used(connection_id)
        tables = pg_client.get_tables(conn_data)
        return jsonify(tables)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/tables/<table_name>/columns', methods=['GET'])
def get_table_columns(connection_id, table_name):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        columns = pg_client.get_table_columns(conn_data, table_name)
        primary_keys = pg_client.get_primary_keys(conn_data, table_name)

        # Mark primary key columns
        for col in columns:
            col['is_primary_key'] = col['name'] in primary_keys

        return jsonify(columns)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/tables/<table_name>/indexes', methods=['GET'])
def get_table_indexes(connection_id, table_name):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        indexes = pg_client.get_table_indexes(conn_data, table_name)
        return jsonify(indexes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/tables/<table_name>/relations', methods=['GET'])
def get_table_relations(connection_id, table_name):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        relations = pg_client.get_table_relations(conn_data, table_name)
        return jsonify(relations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/tables/<table_name>/ddl', methods=['GET'])
def get_table_ddl(connection_id, table_name):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        ddl = pg_client.get_table_ddl(conn_data, table_name)
        return jsonify({'ddl': ddl})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/tables/<table_name>/stats', methods=['GET'])
def get_table_stats(connection_id, table_name):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        stats = pg_client.get_table_stats(conn_data, table_name)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Query Execution
@app.route('/api/connections/<int:connection_id>/query', methods=['POST'])
def execute_query(connection_id):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        data = request.json
        query = data.get('query', '')
        limit = data.get('limit')

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        result = pg_client.execute_query(conn_data, query, limit)

        # Save to history if successful
        if result.get('success'):
            db.save_query_history(connection_id, query, result.get('execution_time', 0))

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/format-sql', methods=['POST'])
def format_sql_endpoint(connection_id):
    try:
        data = request.json
        query = data.get('query', '')

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        formatted = format_sql(query)
        return jsonify({'formatted': formatted})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Autocomplete
@app.route('/api/connections/<int:connection_id>/autocomplete', methods=['GET'])
def get_autocomplete(connection_id):
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        autocomplete_data = pg_client.get_autocomplete_data(conn_data)
        return jsonify(autocomplete_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# AI Features
@app.route('/api/ai/generate-sql', methods=['POST'])
def generate_sql():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        connection_id = data.get('connection_id')

        print("🤖 Generate SQL request:")
        print(f"   Prompt: {prompt[:100]}...")
        print(f"   Connection ID: {connection_id}")

        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        if not connection_id:
            print("⚠️ Warning: No connection_id provided")
            return jsonify({'error': 'Connection ID is required'}), 400

        # Get schema context from cache or fetch if not cached
        schema_context = ""
        if connection_id:
            # Try to get cached schema first
            cached = db.get_schema_cache(connection_id)

            if cached:
                schema_data = cached['schema']
                print(f"✅ Using cached schema from {cached['cached_at']}")
            else:
                # Schema not cached, fetch and cache it now
                print(f"⚠️ Schema not cached for connection {connection_id}, fetching...")
                conn_data = db.get_connection_by_id(connection_id)
                if conn_data:
                    schema_data = fetch_and_cache_schema(connection_id, conn_data)
                else:
                    schema_data = None

            if schema_data:
                schema_context = ai_service.build_schema_context(schema_data)

        # Get conversation history for context
        conversation_history = []
        if connection_id:
            try:
                # Get recent conversations (excluding the current one)
                all_conversations = db.get_ai_conversations(connection_id, limit=20)
                # Reverse to get chronological order (oldest first) for AI context
                conversation_history = list(reversed(all_conversations))
                print(f"📜 Including {len(conversation_history)} previous messages for context")
            except Exception as e:
                print(f"⚠️ Failed to load conversation history: {e}")

        result = ai_service.generate_sql(prompt, schema_context, conversation_history)

        # Save conversation if successful
        if result.get('success') and connection_id:
            db.save_ai_conversation(connection_id, prompt, result['sql'])
            print(f"✅ Saved AI conversation for connection {connection_id}")
            print(f"   Prompt: {prompt[:50]}...")
            print(f"   SQL: {result['sql'][:50]}...")

        return jsonify(result)
    except Exception as e:
        print(f"Error in generate_sql: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/conversations/<int:connection_id>', methods=['GET'])
def get_ai_conversations(connection_id):
    try:
        conversations = db.get_ai_conversations(connection_id)
        print(f"📜 Loaded {len(conversations)} conversations for connection {connection_id}")
        return jsonify(conversations)
    except Exception as e:
        print(f"❌ Error loading conversations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/conversations/<int:conversation_id>', methods=['DELETE'])
def delete_ai_conversation(conversation_id):
    try:
        success = db.delete_ai_conversation(conversation_id)
        if success:
            return jsonify({'message': 'Conversation deleted'})
        return jsonify({'error': 'Conversation not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connections/<int:connection_id>/refresh-schema', methods=['POST'])
def refresh_schema(connection_id):
    """Manually refresh cached schema for a connection"""
    try:
        conn_data = db.get_connection_by_id(connection_id)
        if not conn_data:
            return jsonify({'error': 'Connection not found'}), 404

        # Fetch and cache fresh schema
        schema_data = fetch_and_cache_schema(connection_id, conn_data)

        return jsonify({
            'success': True,
            'message': 'Schema refreshed successfully',
            'table_count': len(schema_data.get('tables', []))
        })
    except Exception as e:
        print(f"Error refreshing schema: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Query History & Favorites
@app.route('/api/history/<int:connection_id>', methods=['GET'])
def get_query_history(connection_id):
    try:
        history = db.get_query_history(connection_id)
        return jsonify(history)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history/<int:history_id>', methods=['DELETE'])
def delete_query_history_item(history_id):
    try:
        success = db.delete_query_history(history_id)
        if success:
            return jsonify({'message': 'History item deleted'})
        return jsonify({'error': 'History item not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    try:
        favorites = db.get_favorites()
        return jsonify(favorites)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites', methods=['POST'])
def create_favorite():
    try:
        data = request.json
        favorite_id = db.save_favorite(data)
        return jsonify({'id': favorite_id, 'message': 'Favorite saved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites/<int:favorite_id>', methods=['PUT'])
def update_favorite(favorite_id):
    try:
        data = request.json
        success = db.update_favorite(favorite_id, data)
        if success:
            return jsonify({'message': 'Favorite updated'})
        return jsonify({'error': 'Favorite not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites/<int:favorite_id>', methods=['DELETE'])
def delete_favorite(favorite_id):
    try:
        success = db.delete_favorite(favorite_id)
        if success:
            return jsonify({'message': 'Favorite deleted'})
        return jsonify({'error': 'Favorite not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Query Tabs
@app.route('/api/tabs/<int:connection_id>', methods=['GET'])
def get_tabs(connection_id):
    try:
        tabs = db.get_tabs(connection_id)
        return jsonify(tabs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tabs', methods=['POST'])
def create_tab():
    try:
        data = request.json
        tab_id = db.save_tab(data)
        return jsonify({'id': tab_id, 'message': 'Tab saved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tabs/<int:tab_id>', methods=['DELETE'])
def delete_tab(tab_id):
    try:
        success = db.delete_tab(tab_id)
        if success:
            return jsonify({'message': 'Tab deleted'})
        return jsonify({'error': 'Tab not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Settings
@app.route('/api/settings', methods=['GET'])
def get_settings():
    try:
        settings = db.get_all_settings()
        # Don't send API key to frontend (send only indicator if it exists)
        if 'openai_api_key' in settings:
            settings['openai_api_key_set'] = True
            del settings['openai_api_key']
        return jsonify(settings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    try:
        data = request.json
        print(f"Updating settings: {list(data.keys())}")

        for key, value in data.items():
            if key == 'openai_api_key':
                try:
                    ai_service.set_api_key(value)
                    print("OpenAI API key updated successfully")
                except Exception as e:
                    print(f"Error setting OpenAI API key: {e}")
                    import traceback
                    traceback.print_exc()
                    return jsonify({'error': f'Failed to set API key: {str(e)}'}), 500
            elif key == 'openai_model':
                ai_service.set_model(value)
            else:
                db.save_setting(key, value)

        return jsonify({'message': 'Settings updated'})
    except Exception as e:
        print(f"Error in update_settings: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    print(f' * Starting Flask on http://127.0.0.1:{port}')
    app.run(host='127.0.0.1', port=port, debug=False)

