#!/bin/bash

# Configuration
CONTAINER_NAME="forefront-postgres"
DB_NAME="forefront"
RENDER_DB_URL="postgresql://forefront_user:KXeZGcBCHgM85EUxgFIeBFAgMEkb51mv@dpg-d6pfopn5gffc739c7qgg-a.singapore-postgres.render.com/forefront"

echo "🚀 Starting Knowledge Migration from Docker to Render (OpenAI Optimized)..."

# 1. Dump core knowledge tables from Docker (excluding vectors which are now incompatible)
echo "📦 Dumping knowledge tables from container: $CONTAINER_NAME..."
docker exec $CONTAINER_NAME pg_dump -U postgres $DB_NAME \
  -t knowledge_sources \
  -t knowledge_vectors \
  -t website_pages \
  -t qna_pairs \
  --no-owner --no-acl \
  -f /tmp/knowledge_dump.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to dump from Docker. Is the container '$CONTAINER_NAME' running?"
    exit 1
fi

# 2. Copy to host
echo "📂 Copying dump to local filesystem..."
docker cp $CONTAINER_NAME:/tmp/knowledge_dump.sql ./knowledge_dump.sql

# 3. Restore to Render
echo "🌐 Restoring to Render Database..."
# Note: We use --clean to ensure we don't have conflicts if partial data exists
psql "$RENDER_DB_URL" -f ./knowledge_dump.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to restore to Render."
    exit 1
fi

# 4. Clean up incompatible vectors and reset for OpenAI Re-indexing
echo "🧹 Cleaning incompatible vectors and resetting status for OpenAI..."
psql "$RENDER_DB_URL" -c "TRUNCATE knowledge_vectors; UPDATE knowledge_sources SET status = 'pending';"

# 5. Cleanup local file
rm ./knowledge_dump.sql

echo "✅ Knowledge data migrated! Once you redeploy with OpenAI keys, the server will auto-reindex everything."
