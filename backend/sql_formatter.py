import sqlparse

def format_sql(query: str) -> str:
    """Format SQL query for readability"""
    try:
        formatted = sqlparse.format(
            query,
            reindent=True,
            keyword_case='upper',
            indent_width=2
        )
        return formatted
    except Exception as e:
        print(f"SQL formatting error: {e}")
        return query

