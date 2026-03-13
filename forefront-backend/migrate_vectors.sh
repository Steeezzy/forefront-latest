#!/bin/bash

# Configuration
CONTAINER_NAME="forefront-postgres"
DB_NAME="forefront"
RENDER_DB_URL="postgresql://forefront_user:KXeZGcBCHgM85EUxgFIeBFAgMEkb51mv@dpg-d6pfopn5gffc739c7qgg-a.singapore-postgres.render.com/forefront"

echo "🚀 Starting vector migration from Docker to Render..."

# 1. Dump from Docker
echo "📦 Dumping 'knowledge_vectors' table from container: $CONTAINER_NAME..."
docker exec $CONTAINER_NAME pg_dump -U postgres $DB_NAME \
  -t knowledge_vectors \
  --no-owner --no-acl \
  -f /tmp/vectors_dump.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to dump from Docker."
    exit 1
fi

# 2. Copy to host
echo "📂 Copying dump to local filesystem..."
docker cp $CONTAINER_NAME:/tmp/vectors_dump.sql ./vectors_dump.sql

# 3. Restore to Render
echo "🌐 Restoring to Render Database..."
psql "$RENDER_DB_URL" -f ./vectors_dump.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to restore to Render."
    exit 1
fi

# 4. Cleanup
echo "🧹 Cleaning up temporary files..."
rm ./vectors_dump.sql

echo "✅ Migration complete! Check your Render DB vector count."
