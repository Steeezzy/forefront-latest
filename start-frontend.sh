#!/bin/bash
# Kill any existing process on port 3000
lsof -t -i:3000 | xargs kill -9 2>/dev/null

# Run next dev directly
# We need to find next binary
# Run next dev directly (foreground) for screen session
./node_modules/.bin/next dev > frontend_startup.log 2>&1

PID=$!
echo "Frontend started with PID $PID"
echo $PID > frontend.pid

sleep 5
if ps -p $PID > /dev/null; then
   echo "Frontend running..."
else
   echo "Frontend crashed!"
   cat frontend_startup.log
fi
