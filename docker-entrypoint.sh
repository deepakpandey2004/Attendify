#!/bin/bash
set -e

echo "🚀 Starting Attendify..."

# Wait for DB to be ready
echo "⏳ Waiting for database..."
for i in {1..30}; do
    if python -c "from app.database import engine; engine.connect().close()" 2>/dev/null; then
        echo "✅ Database is ready!"
        break
    fi
    echo "  Retry $i/30..."
    sleep 2
done

# Run migrations
echo "📦 Running database migrations..."
alembic upgrade head || echo "⚠️  Migration failed (might be first run)"

# Start the app
echo "🎯 Launching Attendify API..."
exec "$@"