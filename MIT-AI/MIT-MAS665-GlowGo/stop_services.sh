#!/bin/bash

# GlowGo Stop Services Script
# This script stops both the backend and frontend services

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"

# Function to stop services by port
stop_service() {
    local port=$1
    local service_name=$2
    
    echo "Stopping $service_name (port $port)..."
    
    # Find and kill process using the port
    PID=$(lsof -ti:$port)
    if [ -n "$PID" ]; then
        kill -9 $PID
        echo "$service_name stopped (PID: $PID)"
    else
        echo "$service_name not running on port $port"
    fi
}

# Main execution
echo "=== Stopping GlowGo Services ==="

# Stop backend (port 8000)
stop_service 8000 "Backend"

# Stop frontend (port 3000)
stop_service 3000 "Frontend"

echo ""
echo "=== Services Stopped ==="
echo "Logs are still available at: $LOGS_DIR/"



