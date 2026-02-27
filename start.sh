#!/bin/bash
# ── Pluang Dashboard Startup Script ──
# Starts both backend (3001) and frontend (3000) with proper PATH.
# Handles cleanup on exit and auto-restarts crashed servers.

set -e

export PATH="/Users/rahulbhatnagar/.nvm/versions/node/v20.19.5/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
DIR="$(cd "$(dirname "$0")" && pwd)"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo "Done."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

start_backend() {
  echo "[backend] Starting on port 3001..."
  node "$DIR/backend/server.js" &
  BACKEND_PID=$!
}

start_frontend() {
  echo "[frontend] Starting on port 3000..."
  cd "$DIR/frontend" && npx vite --port 3000 &
  FRONTEND_PID=$!
  cd "$DIR"
}

# Kill anything already on our ports
echo "Checking for existing processes..."
lsof -ti :3000 | xargs kill 2>/dev/null || true
lsof -ti :3001 | xargs kill 2>/dev/null || true
sleep 1

# Start both servers
start_backend
start_frontend

echo ""
echo "════════════════════════════════════════════"
echo "  Dashboard running:"
echo "    Frontend → http://localhost:3000"
echo "    Backend  → http://localhost:3001"
echo "    Press Ctrl+C to stop both servers"
echo "════════════════════════════════════════════"
echo ""

# Monitor and restart crashed servers
while true; do
  # Check backend
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "[backend] Crashed! Restarting..."
    sleep 1
    start_backend
  fi

  # Check frontend
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "[frontend] Crashed! Restarting..."
    sleep 1
    start_frontend
  fi

  sleep 5
done
