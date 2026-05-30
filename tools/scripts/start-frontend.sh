#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/../../apps/web"
RUNTIME_DIR="$SCRIPT_DIR/../runtime"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"
NEXT_BIN="$SCRIPT_DIR/../../node_modules/.bin/next"

mkdir -p "$LOG_DIR" "$PID_DIR"
cd "$APP_DIR"

# Kill any existing process on port 3000
lsof -t -i:3000 | xargs kill -9 2>/dev/null

# Clear stale dev artifacts that can cause random ENOENT/Internal Server Error states
rm -rf .next

# Run next dev on a fixed port to avoid backend collision on 8000.
# Turbopack has shown intermittent ENOENT manifest issues in this workspace.
"$NEXT_BIN" dev -p 3000 > "$LOG_DIR/frontend_startup.log" 2>&1 &

PID=$!
disown $PID
echo "Frontend started with PID $PID"
echo $PID > "$PID_DIR/frontend.pid"

sleep 5
if ps -p $PID > /dev/null; then
   echo "Frontend running..."
else
   echo "Frontend crashed!"
   cat "$LOG_DIR/frontend_startup.log"
fi
