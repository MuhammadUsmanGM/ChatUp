#!/bin/sh
# Entrypoint script for Railway deployment

# Set default port if not provided
if [ -z "$PORT" ]; then
    PORT=8000
fi

echo "Starting server on port $PORT"

# Start the application
exec python start_server.py