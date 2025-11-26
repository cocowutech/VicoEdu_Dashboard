#!/bin/bash

# GlowGo Quick Start Script
# This script starts both the backend and frontend services with logging

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/glowgo-backend"
FRONTEND_DIR="$SCRIPT_DIR/glowgo-frontend"
LOGS_DIR="$SCRIPT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to start backend
start_backend() {
    echo "Starting GlowGo Backend..."
    cd "$BACKEND_DIR"
    
    # Check if virtual environment exists
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo "Backend virtual environment not found. Creating one..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    fi
    
    # Start backend with logging
    nohup python main.py > "$LOGS_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    echo "Backend logs: $LOGS_DIR/backend.log"
}

# Function to start frontend
start_frontend() {
    echo "Starting GlowGo Frontend..."
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend with logging
    nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    echo "Frontend logs: $LOGS_DIR/frontend.log"
}

# Main execution
echo "=== GlowGo Quick Start ==="
echo "Starting services..."

# Start backend
start_backend

# Start frontend
start_frontend

echo ""
echo "=== Services Started ==="
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "To view logs:"
echo "  Backend: tail -f $LOGS_DIR/backend.log"
echo "  Frontend: tail -f $LOGS_DIR/frontend.log"
echo ""
echo "Backend URL: http://localhost:8000"
echo "Frontend URL: http://localhost:3000"
echo ""
echo "=== GlowGo is running! ==="


