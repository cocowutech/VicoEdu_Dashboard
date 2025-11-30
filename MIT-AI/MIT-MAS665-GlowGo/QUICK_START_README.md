# GlowGo Quick Start Guide

This guide explains how to quickly start and stop the GlowGo backend and frontend services.

## Prerequisites

- Python 3.8+ for the backend
- Node.js 14+ for the frontend
- npm or yarn

## Quick Start

To start both the backend and frontend services with logging:

```bash
./quick_start.sh
```

This script will:
1. Create a `/logs` directory if it doesn't exist
2. Start the backend service on port 8000
3. Start the frontend service on port 3000
4. Redirect all logs to separate files in the `/logs` directory

## Accessing the Services

Once started, you can access:
- Backend API: http://localhost:8000
- Frontend Application: http://localhost:3000
- API Documentation: http://localhost:8000/docs

## Viewing Logs

To view the logs in real-time:

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log
```

## Stopping the Services

To stop both services:

```bash
./stop_services.sh
```

This script will find and kill the processes running on ports 8000 and 3000.

## Manual Control

If you need more control, you can start the services manually:

### Backend
```bash
cd glowgo-backend
source venv/bin/activate  # or create venv if it doesn't exist
python main.py
```

### Frontend
```bash
cd glowgo-frontend
npm install  # if dependencies not installed
npm run dev
```

## Troubleshooting

1. **Port already in use**: The stop script should handle this, but if not, you can manually kill the process:
   ```bash
   lsof -ti:8000 | xargs kill -9  # For backend
   lsof -ti:3000 | xargs kill -9  # For frontend
   ```

2. **Dependencies not installed**: The quick start script will attempt to install dependencies if they're missing.

3. **Permission denied**: Make sure the scripts are executable:
   ```bash
   chmod +x quick_start.sh stop_services.sh
   ```

## Log Files

All logs are stored in the `/logs` directory:
- `backend.log`: Contains all backend service logs
- `frontend.log`: Contains all frontend service logs

These logs are useful for debugging issues with either service.



