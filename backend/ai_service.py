from openai import OpenAI
from typing import Dict, Any, List, Optional
from database import db
import os
import time

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
                    timeout=60.0,  # Increased timeout for complex health analysis
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
                timeout=60.0,  # Increased timeout for complex health analysis
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

    def _call_openai_with_retry(self, **params) -> Any:
        """Call OpenAI API with retry logic"""
        max_retries = 5
        last_error = None

        for attempt in range(max_retries):
            try:
                return self.client.chat.completions.create(**params)
            except Exception as e:
                last_error = str(e)
                if attempt < max_retries - 1:
                    time.sleep(0.5)
                    continue
                raise Exception(f'Failed after {max_retries} attempts. Last error: {last_error}')

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

            response = self._call_openai_with_retry(**params)

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

    def explain_query(self, query: str, schema_context: str) -> Dict[str, Any]:
        """Explain SQL query in plain English"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            system_prompt = f"""You are a PostgreSQL expert. Explain SQL queries in simple, plain English.
Break down what the query does step by step for someone who may not be familiar with SQL.

{schema_context}

Rules:
- Use simple language, avoid technical jargon where possible
- Explain the purpose and logic of the query
- Mention which tables/columns are involved
- Explain JOINs, WHERE conditions, and aggregations clearly
- Format the explanation with bullet points or paragraphs for readability
- Be concise but thorough"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Explain this SQL query:\n\n{query}"}
            ]

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
                params["max_completion_tokens"] = 1000
            else:
                params["temperature"] = 0.5
                params["max_tokens"] = 1000

            response = self._call_openai_with_retry(**params)
            explanation = response.choices[0].message.content.strip()

            return {
                'success': True,
                'explanation': explanation
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def debug_query(self, query: str, error: str, schema_context: str) -> Dict[str, Any]:
        """Debug and fix SQL query errors"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            system_prompt = f"""You are a PostgreSQL expert debugger. Fix SQL queries that have errors.

{schema_context}

Rules:
- Analyze the error message carefully
- Identify the root cause (syntax error, wrong column name, type mismatch, etc.)
- Return the FIXED SQL query
- Provide a clear explanation of what was wrong
- Return response in JSON format with 'fixed_query' and 'explanation' keys"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Fix this SQL query:\n\nQuery:\n{query}\n\nError:\n{error}"}
            ]

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
                params["max_completion_tokens"] = 800
            else:
                params["temperature"] = 0.3
                params["max_tokens"] = 800

            response = self._call_openai_with_retry(**params)
            content = response.choices[0].message.content.strip()

            # Try to parse as JSON first
            import json
            try:
                result = json.loads(content)
                fixed_query = result.get('fixed_query', '').strip()
                explanation = result.get('explanation', '')
            except:
                # Fallback: extract SQL from markdown if present
                if '```' in content:
                    lines = content.split('\n')
                    in_code = False
                    fixed_lines = []
                    explanation_lines = []

                    for line in lines:
                        if line.startswith('```'):
                            in_code = not in_code
                            continue
                        if in_code:
                            fixed_lines.append(line)
                        else:
                            explanation_lines.append(line)

                    fixed_query = '\n'.join(fixed_lines).strip()
                    explanation = '\n'.join(explanation_lines).strip()
                else:
                    # Assume entire response is the fixed query
                    fixed_query = content
                    explanation = "Query has been fixed."

            return {
                'success': True,
                'fixed_query': fixed_query,
                'explanation': explanation
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def optimize_query(self, query: str, schema_context: str, exec_time: float = None,
                      indexes_context: str = None) -> Dict[str, Any]:
        """Optimize SQL query for better performance"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            exec_info = f"\n\nCurrent execution time: {exec_time}s" if exec_time else ""
            indexes_info = f"\n\nExisting indexes:\n{indexes_context}" if indexes_context else ""

            system_prompt = f"""You are a PostgreSQL performance optimization expert. Analyze queries and suggest improvements.

{schema_context}{indexes_info}

Rules:
- Suggest specific optimizations (add indexes, rewrite JOINs, use better WHERE clauses, etc.)
- Provide the optimized query
- Explain each optimization and its expected impact
- Consider index usage, query structure, and PostgreSQL best practices
- Return response in JSON format with 'optimized_query', 'suggestions' (array), and 'explanation' keys"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Optimize this SQL query:\n\n{query}{exec_info}"}
            ]

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
                params["max_completion_tokens"] = 1500
            else:
                params["temperature"] = 0.4
                params["max_tokens"] = 1500

            response = self._call_openai_with_retry(**params)
            content = response.choices[0].message.content.strip()

            # Try to parse as JSON
            import json
            try:
                result = json.loads(content)
                optimized_query = result.get('optimized_query', query).strip()
                suggestions = result.get('suggestions', [])
                explanation = result.get('explanation', '')
            except:
                # Fallback parsing
                if '```' in content:
                    lines = content.split('\n')
                    in_code = False
                    query_lines = []
                    other_lines = []

                    for line in lines:
                        if line.startswith('```'):
                            in_code = not in_code
                            continue
                        if in_code:
                            query_lines.append(line)
                        else:
                            other_lines.append(line)

                    optimized_query = '\n'.join(query_lines).strip()
                    explanation = '\n'.join(other_lines).strip()
                    suggestions = []
                else:
                    optimized_query = query
                    explanation = content
                    suggestions = []

            return {
                'success': True,
                'original_query': query,
                'optimized_query': optimized_query,
                'suggestions': suggestions,
                'explanation': explanation
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def analyze_explain_plan(self, explain_output: str, query: str, schema_context: str) -> Dict[str, Any]:
        """Analyze EXPLAIN ANALYZE output and provide insights"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            system_prompt = f"""You are a PostgreSQL performance analysis expert. Analyze EXPLAIN ANALYZE output and provide actionable insights.

{schema_context}

Rules:
- Identify performance bottlenecks (sequential scans, slow joins, missing indexes)
- Explain the execution plan in simple terms
- Provide specific recommendations for improvement
- Highlight the most expensive operations
- Suggest indexes or query rewrites where applicable
- Return response in JSON format with 'insights' (array), 'bottlenecks' (array), 'recommendations' (array), and 'summary' keys"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this query execution plan:\n\nQuery:\n{query}\n\nEXPLAIN ANALYZE Output:\n{explain_output}"}
            ]

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
                params["max_completion_tokens"] = 2000
            else:
                params["temperature"] = 0.4
                params["max_tokens"] = 2000

            response = self._call_openai_with_retry(**params)
            content = response.choices[0].message.content.strip()

            # Try to parse as JSON
            import json
            try:
                result = json.loads(content)
                insights = result.get('insights', [])
                bottlenecks = result.get('bottlenecks', [])
                recommendations = result.get('recommendations', [])
                summary = result.get('summary', '')
            except:
                # Fallback: treat entire response as summary
                insights = []
                bottlenecks = []
                recommendations = []
                summary = content

            return {
                'success': True,
                'insights': insights,
                'bottlenecks': bottlenecks,
                'recommendations': recommendations,
                'summary': summary,
                'raw_output': explain_output
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def suggest_indexes(self, schema_data: Dict[str, Any], query_history: List[Dict[str, Any]],
                       existing_indexes: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Suggest missing indexes based on query history and schema"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            schema_context = self.build_schema_context(schema_data)

            # Build indexes context
            indexes_context = "\n\nExisting Indexes:\n"
            for table, indexes in existing_indexes.items():
                indexes_context += f"\nTable: {table}\n"
                for idx in indexes:
                    indexes_context += f"  - {idx.get('name', 'unknown')}: {idx.get('definition', 'N/A')}\n"

            # Build query history context (limit to recent queries)
            queries_context = "\n\nRecent Query History (most frequent patterns):\n"
            for i, qh in enumerate(query_history[:50], 1):  # Limit to 50 queries
                queries_context += f"{i}. {qh.get('query', '')[:200]}...\n"

            system_prompt = f"""You are a PostgreSQL database performance expert specializing in index optimization.

Analyze the schema, existing indexes, and query patterns to recommend missing indexes that would improve performance.

{schema_context}{indexes_context}

Rules:
- Look for common patterns in WHERE clauses, JOINs, and ORDER BY
- Suggest composite indexes where multiple columns are frequently used together
- Don't suggest indexes that already exist
- Prioritize high-impact indexes
- Provide CREATE INDEX statements
- Return response in JSON format with 'recommendations' (array of objects with 'table', 'columns', 'reason', 'create_statement' keys)"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Suggest missing indexes based on these query patterns:\n{queries_context}"}
            ]

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
                params["max_completion_tokens"] = 2000
            else:
                params["temperature"] = 0.3
                params["max_tokens"] = 2000

            response = self._call_openai_with_retry(**params)
            content = response.choices[0].message.content.strip()

            # Try to parse as JSON
            import json
            try:
                result = json.loads(content)
                recommendations = result.get('recommendations', [])
            except:
                # Fallback: try to extract CREATE INDEX statements
                recommendations = []
                lines = content.split('\n')
                for line in lines:
                    if 'CREATE INDEX' in line.upper():
                        recommendations.append({
                            'create_statement': line.strip(),
                            'reason': 'Based on query patterns'
                        })

            return {
                'success': True,
                'recommendations': recommendations,
                'analyzed_queries': len(query_history)
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def analyze_slow_queries_batch(self, queries: List[Dict[str, Any]], schema_context: str) -> Dict[str, Any]:
        """Analyze multiple slow queries and provide optimization recommendations"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            # Build queries context
            queries_context = "\n\nSlow Queries to Analyze:\n\n"
            for i, q in enumerate(queries[:10], 1):  # Limit to 10 queries
                query_text = q.get('query', '')
                exec_time = q.get('execution_time', 0)
                executed_at = q.get('executed_at', 'Unknown')
                queries_context += f"{i}. Query (executed: {executed_at}, time: {exec_time}s):\n{query_text}\n\n"

            system_prompt = f"""You are a PostgreSQL performance optimization expert. Analyze these slow queries and provide actionable recommendations.

{schema_context}

Rules:
- For each query, identify why it's slow
- Provide specific optimization suggestions
- Recommend indexes where applicable
- Estimate potential performance improvement
- Prioritize recommendations by impact
- Return response in JSON format with 'analyses' array containing objects with:
  - 'query_number': int
  - 'issues': array of strings (what makes it slow)
  - 'recommendations': array of strings (specific fixes)
  - 'indexes': array of CREATE INDEX statements (if applicable)
  - 'estimated_improvement': string (e.g., "50-70% faster")
- Also include 'summary' with overall insights"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze these slow queries and provide optimization recommendations:\n{queries_context}"}
            ]

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
                params["max_completion_tokens"] = 3000
            else:
                params["temperature"] = 0.4
                params["max_tokens"] = 3000

            response = self._call_openai_with_retry(**params)
            content = response.choices[0].message.content.strip()

            # Try to parse as JSON
            import json
            try:
                result = json.loads(content)
                analyses = result.get('analyses', [])
                summary = result.get('summary', '')
            except:
                # Fallback: treat as plain text
                analyses = []
                summary = content

            return {
                'success': True,
                'analyses': analyses,
                'summary': summary,
                'query_count': len(queries)
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def analyze_database_health(self, bloat_data: Dict[str, Any], index_data: Dict[str, Any],
                                cache_data: Dict[str, Any], schema_context: str) -> Dict[str, Any]:
        """Analyze database health and provide optimization recommendations"""
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI API key not configured. Please add it in Settings.'
            }

        try:
            # Build health context
            health_context = f"""Database Health Analysis Data:

BLOAT & VACUUM STATS:
{len(bloat_data.get('tables', []))} tables analyzed
Sample top issues:
"""
            # Add top 5 most bloated tables
            bloated_tables = sorted(bloat_data.get('tables', []),
                                   key=lambda x: x.get('bloat_percent', 0),
                                   reverse=True)[:5]
            for t in bloated_tables:
                health_context += f"- {t['tablename']}: {t['bloat_percent']}% bloat, {t['total_size']}, {t['n_dead_tup']} dead tuples\n"

            health_context += f"\nINDEX ANALYSIS:\n"
            health_context += f"{len(index_data.get('indexes', []))} indexes analyzed\n"

            # Unused indexes
            unused = [idx for idx in index_data.get('indexes', []) if idx.get('idx_scan', 0) == 0]
            health_context += f"{len(unused)} unused indexes found\n"
            for idx in unused[:5]:
                health_context += f"- {idx['indexname']} on {idx['tablename']}: {idx['index_size']}, 0 scans\n"

            # Duplicate indexes
            if index_data.get('duplicates'):
                health_context += f"\n{len(index_data['duplicates'])} potential duplicate index groups\n"

            health_context += f"\nCACHE HIT RATIO:\n"
            overall_cache = cache_data.get('overall', {})
            cache_ratio = overall_cache.get('cache_hit_ratio', 0)
            health_context += f"Overall: {cache_ratio}%\n"

            # Tables with poor cache hit ratio
            poor_cache_tables = [t for t in cache_data.get('tables', [])
                                if t.get('cache_hit_ratio', 100) < 90][:5]
            if poor_cache_tables:
                health_context += "Tables with poor cache hit ratio:\n"
                for t in poor_cache_tables:
                    health_context += f"- {t['tablename']}: {t['cache_hit_ratio']}%\n"

            system_prompt = f"""You are a PostgreSQL database optimization expert. Analyze the health data and provide actionable recommendations.

{schema_context}

Rules:
- Calculate an overall health score (0-100) based on bloat, unused indexes, cache hit ratio
- Identify critical, high, medium, and low priority issues
- Provide specific, actionable recommendations with SQL commands where applicable
- Estimate impact of each recommendation
- Return response in JSON format with:
  - 'health_score': int (0-100)
  - 'grade': string ('A', 'B', 'C', 'D', 'F')
  - 'critical_issues': array of issue objects
  - 'action_items': array with 'priority', 'title', 'description', 'fix_sql', 'impact'
  - 'summary': overall assessment string"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this database health:\n\n{health_context}"}
            ]

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
                params["max_completion_tokens"] = 2500
            else:
                params["temperature"] = 0.4
                params["max_tokens"] = 2500

            response = self._call_openai_with_retry(**params)
            content = response.choices[0].message.content.strip()

            # Try to parse as JSON
            import json
            try:
                result = json.loads(content)
                health_score = result.get('health_score', 0)
                grade = result.get('grade', 'N/A')
                critical_issues = result.get('critical_issues', [])
                action_items = result.get('action_items', [])
                summary = result.get('summary', '')
            except:
                # Fallback: generate basic assessment
                health_score = 70  # Default
                grade = 'C'
                critical_issues = []
                action_items = []
                summary = content

            return {
                'success': True,
                'health_score': health_score,
                'grade': grade,
                'critical_issues': critical_issues,
                'action_items': action_items,
                'summary': summary
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# Global instance
ai_service = AIService()

