#!/bin/bash
cd questron-backend
# Kill any existing process on port 3001
lsof -t -i:3001 | xargs kill -9 2>/dev/null

# Run tsx directly (foreground) for screen session
node ./node_modules/tsx/dist/cli.mjs src/server.ts > ../backend_startup.log 2>&1

PID=$!
echo "Backend started with PID $PID"
echo $PID > ../backend.pid

# Wait a bit to check if it crashes
sleep 5
if ps -p $PID > /dev/null; then
   echo "Backend running..."
   tail -n 10 ../backend_startup.log
else
   echo "Backend crashed!"
   cat ../backend_startup.log
fi
