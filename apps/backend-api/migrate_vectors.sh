#!/bin/bash

# Configuration
CONTAINER_NAME="questron-postgres"
DB_NAME="questron"
RENDER_DB_URL="postgresql://questron_user:KXeZGcBCHgM85EUxgFIeBFAgMEkb51mv@dpg-d6pfopn5gffc739c7qgg-a.singapore-postgres.render.com/questron"

echo "🚀 Starting Knowledge Migration from Docker to Render (Groq + MiniLM Optimized)..."

# 1. Dump core knowledge tables from Docker (excluding vectors which are now incompatible)
echo "📦 Dumping knowledge tables from container: $CONTAINER_NAME..."
docker exec $CONTAINER_NAME pg_dump -U postgres $DB_NAME \
  -t knowledge_sources \
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
psql "$RENDER_DB_URL" -f ./knowledge_dump.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to restore to Render."
    exit 1
fi

# 4. Clean up incompatible vectors and reset for MiniLM Re-indexing
echo "🧹 Cleaning incompatible vectors and resetting status for MiniLM..."
psql "$RENDER_DB_URL" -c "TRUNCATE knowledge_vectors; UPDATE knowledge_sources SET status = 'pending';"

# 5. Cleanup local file
rm ./knowledge_dump.sql

echo "✅ Knowledge data migrated! Once you redeploy with MiniLM, the server will auto-reindex everything using local processing (384 dimensions)."
