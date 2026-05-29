#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/../../apps/backend-api"
RUNTIME_DIR="$SCRIPT_DIR/../runtime"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"
cd "$APP_DIR"
# Kill any existing process on port 8000
lsof -t -i:8000 | xargs kill -9 2>/dev/null

# Run tsx directly (foreground) for screen session
node ./node_modules/tsx/dist/cli.mjs src/index.ts > "$LOG_DIR/backend_startup.log" 2>&1 &

PID=$!
echo "Backend started with PID $PID"
echo $PID > "$PID_DIR/backend.pid"

# Wait a bit to check if it crashes
sleep 5
if ps -p $PID > /dev/null; then
   echo "Backend running..."
   tail -n 10 "$LOG_DIR/backend_startup.log"
else
   echo "Backend crashed!"
   cat "$LOG_DIR/backend_startup.log"
fi
