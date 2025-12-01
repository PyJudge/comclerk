#!/bin/bash

# OpenCode Development Startup Script
# Starts both backend (opencode_original) and frontend (opencode-web)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../opencode_original"
FRONTEND_DIR="$SCRIPT_DIR"

BACKEND_PORT=${BACKEND_PORT:-4096}

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "=================================="
echo "  OpenCode Development Server"
echo "=================================="
echo ""

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo "Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

# Start backend (opencode_original)
echo "[Backend] Starting on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
bun run --cwd packages/opencode --conditions=browser src/cli/cmd/web.ts --port "$BACKEND_PORT" &
BACKEND_PID=$!
echo "[Backend] PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 2

# Start frontend (opencode-web)
echo ""
echo "[Frontend] Starting on port 3000..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "[Frontend] PID: $FRONTEND_PID"

echo ""
echo "=================================="
echo "  Servers Running"
echo "=================================="
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:3000"
echo "=================================="
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
