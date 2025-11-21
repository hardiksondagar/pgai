from openai import OpenAI
from typing import Dict, Any, Optional
from database import db
import os

class AIService:
    def __init__(self):
        self.client = None
        self.model = "gpt-5-mini"  # Default to GPT-5 Mini for best balance
        self._initialize_client()

    def _initialize_client(self):
        """Initialize OpenAI client with API key from settings"""
        try:
            api_key = db.get_setting('openai_api_key')
            if api_key:
                # Use latest OpenAI SDK initialization (v1.0+)
                self.client = OpenAI(
                    api_key=api_key,
                    timeout=30.0,
                    max_retries=2
                )
                print("✓ OpenAI client initialized successfully")
        except Exception as e:
            print(f"Warning: Failed to initialize OpenAI client: {e}")
            self.client = None

    def set_api_key(self, api_key: str):
        """Set OpenAI API key"""
        try:
            if not api_key or not api_key.strip():
                raise ValueError("API key cannot be empty")

            db.save_setting('openai_api_key', api_key)
            # Reinitialize client with new key
            self.client = OpenAI(
                api_key=api_key,
                timeout=30.0,
                max_retries=2
            )
            print("✓ OpenAI API key set successfully")
        except Exception as e:
            print(f"Error setting API key: {e}")
            raise

    def set_model(self, model: str):
        """Set OpenAI model"""
        self.model = model
        db.save_setting('openai_model', model)

    def build_schema_context(self, schema_data: Dict[str, Any]) -> str:
        """Build schema context string for OpenAI prompt"""
        context = "Database Schema:\n\n"

        for table in schema_data.get('tables', []):
            table_name = table.get('name') if isinstance(table, dict) else table
            context += f"Table: {table_name}\n"

            columns = schema_data.get('columns', {}).get(table_name, [])
            if columns:
                for col in columns:
                    # Handle both dict and string columns
                    if isinstance(col, dict):
                        col_name = col.get('name', 'unknown')
                        col_type = col.get('type', 'unknown')
                        nullable = " NULL" if col.get('is_nullable') == 'YES' else " NOT NULL"
                        context += f"  - {col_name}: {col_type}{nullable}\n"
                    else:
                        # If column is just a string (column name)
                        context += f"  - {col}\n"

            context += "\n"

        return context

    def generate_sql(self, prompt: str, schema_context: str, conversation_history: list = None) -> Dict[str, Any]:
        """Generate SQL from natural language prompt with conversation history"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            system_prompt = f"""You are a PostgreSQL expert assistant. Convert natural language queries to SQL.
You are having a conversation with the user, so consider the context of previous messages.

{schema_context}

Rules:
- Generate valid PostgreSQL queries only
- Use proper table and column names from the schema
- Add appropriate WHERE clauses, JOINs, and aggregations as needed
- Include LIMIT clauses for safety when appropriate
- Return only the SQL query, no explanations
- Use single quotes for string literals
- Format the SQL nicely with proper indentation
- Consider previous conversation context when generating queries"""

            # Build conversation messages
            messages = [{"role": "system", "content": system_prompt}]

            # Add conversation history (last 10 messages to avoid token limits)
            if conversation_history:
                for conv in conversation_history[-10:]:
                    messages.append({"role": "user", "content": conv['user_prompt']})
                    messages.append({"role": "assistant", "content": conv['generated_sql']})

            # Add current prompt
            messages.append({"role": "user", "content": prompt})

            # Build params based on model capabilities
            # GPT-5 and O-series have restricted parameters
            is_gpt5_or_o_series = (
                self.model.startswith("gpt-5") or
                self.model.startswith("o1") or
                self.model.startswith("o3") or
                self.model.startswith("o4")
            )

            params = {
                "model": self.model,
                "messages": messages,
            }

            if is_gpt5_or_o_series:
                # GPT-5 and O-series: only support default temperature (1)
                # and use max_completion_tokens
                params["max_completion_tokens"] = 500
            else:
                # Older models: support temperature and max_tokens
                params["temperature"] = 0.3
                params["max_tokens"] = 500

            response = self.client.chat.completions.create(**params)

            sql = response.choices[0].message.content.strip()

            # Remove markdown code blocks if present
            if sql.startswith('```'):
                lines = sql.split('\n')
                sql = '\n'.join(lines[1:-1]) if len(lines) > 2 else sql

            sql = sql.strip('`').strip()

            return {
                'success': True,
                'sql': sql
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# Global instance
ai_service = AIService()

