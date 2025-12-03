# Database Health & Optimization Hub Plan

## Overview
Create a "Health" section in PGAI that deeply analyzes database internals to find performance issues, bloat, and optimization opportunities that standard tools miss.

## Core Features

### 1. Bloat Analysis (The "Silent Killer" Detector)
- **Backend**: Implement robust bloat estimation query (based on `pg_class`, `avg_width`, `reltuples`).
- **Metrics**: Dead tuples %, wasted bytes, fill factor.
- **Action**: Suggest `VACUUM` or `VACUUM FULL` based on severity.

### 2. Index Hygiene (The "Cleanup Crew")
- **Unused Indexes**: Identify indexes with 0 scans over a long period.
- **Duplicate Indexes**: Find indexes covering identical columns.
- **Bloated Indexes**: Indexes disproportionately large compared to data.
- **Action**: "Drop Index" or "Reindex".

### 3. Maintenance Stats
- **Vacuum Health**: Check if autovacuum is keeping up.
- **Cache Effectiveness**: Table/Index cache hit ratios.

### 4. AI Partitioning Advisor
- **Trigger**: Tables > 1GB or > 1M rows.
- **AI Analysis**: Check schemas & query patterns.
- **Recommendation**: Suggest specific partitioning strategy (e.g., "Partition `logs` by RANGE(created_at)").

## Implementation Steps

### Phase 1: Backend Analysis Engine (`backend/database.py` & `postgres_client.py`)

1.  **`get_database_health_summary(connection_id)`**
    - Aggregates overall health score.
2.  **`get_bloat_stats(connection_id)`**
    - Complex SQL query to estimate table/index bloat.
3.  **`get_index_usage_stats(connection_id)`**
    - Query `pg_stat_user_indexes` for scan counts and sizes.
4.  **`get_vacuum_stats(connection_id)`**
    - Query `pg_stat_user_tables` for last vacuum/analyze times.

### Phase 2: API Layer (`backend/app.py`)

- `GET /api/connections/<id>/health` - Full health report.
- `POST /api/maintenance/run` - Execute maintenance (VACUUM, REINDEX).

### Phase 3: Frontend Dashboard (`src/components/Health/*`)

1.  **HealthDashboard.tsx**: Main view with score and summary cards.
2.  **BloatTable.tsx**: Grid showing bloated tables/indexes.
3.  **IndexAdvisor.tsx**: List of unused/duplicate indexes.
4.  **Integration**: Add "🏥 Health" tab to Sidebar.

## Technical Details: Bloat Query
We will use the standard estimation query (similar to `pg_bloat_check`) that uses valid statistics to estimate density without locking the table.

## Timeline
- **Step 1**: Backend bloat & stats queries (Complex SQL work).
- **Step 2**: API Endpoints.
- **Step 3**: Frontend Dashboard UI.
- **Step 4**: AI Partition Advisor integration.

## Files to Modify/Create
- `backend/postgres_client.py` (Add system queries)
- `backend/app.py` (New endpoints)
- `src/components/Health/` (New directory)
- `src/components/Sidebar/Sidebar.tsx` (Add nav item)

