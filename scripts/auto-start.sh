#!/bin/bash
# Auto-start script for science-model-dashboard
# Checks if the server is running on port 3000 and starts it if not

PORT=3000
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Checking if server is running on port $PORT..."

# Function to check if port is in use (multiple methods for reliability)
is_port_in_use() {
    # Try lsof first
    if lsof -i :$PORT > /dev/null 2>&1; then
        return 0
    fi

    # Try ss as fallback
    if ss -tuln | grep -q ":$PORT "; then
        return 0
    fi

    # Try curl as final check
    if curl -s --connect-timeout 2 http://localhost:$PORT > /dev/null 2>&1; then
        return 0
    fi

    return 1
}

# Check if port 3000 is in use
if is_port_in_use; then
    echo "Server is already running on port $PORT"

    # Get the PID and show info
    PID=$(lsof -t -i :$PORT 2>/dev/null | head -1)
    if [ -n "$PID" ]; then
        echo "Process ID: $PID"
    fi

    # Show the URL
    echo ""
    echo "Dashboard available at:"
    echo "  Local:   http://localhost:$PORT/science-model-dashboard"

    # Try to get network IP
    NETWORK_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -n "$NETWORK_IP" ]; then
        echo "  Network: http://$NETWORK_IP:$PORT/science-model-dashboard"
    fi

    # Get external IP if available
    EXTERNAL_IP=$(curl -s --connect-timeout 2 ifconfig.me 2>/dev/null || curl -s --connect-timeout 2 icanhazip.com 2>/dev/null)
    if [ -n "$EXTERNAL_IP" ]; then
        echo "  External: http://$EXTERNAL_IP:$PORT/science-model-dashboard"
    fi
else
    echo "Server is not running. Starting..."

    # Change to project directory
    cd "$PROJECT_DIR"

    # Start the server in background and capture output
    npm start &
    NPM_PID=$!

    echo "Starting server (PID: $NPM_PID)..."

    # Wait for server to be ready (up to 30 seconds)
    MAX_WAIT=30
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        sleep 2
        WAITED=$((WAITED + 2))

        if is_port_in_use; then
            echo ""
            echo "Server started successfully!"
            echo ""
            echo "Dashboard available at:"
            echo "  Local:   http://localhost:$PORT/science-model-dashboard"

            NETWORK_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
            if [ -n "$NETWORK_IP" ]; then
                echo "  Network: http://$NETWORK_IP:$PORT/science-model-dashboard"
            fi

            EXTERNAL_IP=$(curl -s --connect-timeout 2 ifconfig.me 2>/dev/null || curl -s --connect-timeout 2 icanhazip.com 2>/dev/null)
            if [ -n "$EXTERNAL_IP" ]; then
                echo "  External: http://$EXTERNAL_IP:$PORT/science-model-dashboard"
            fi

            exit 0
        fi

        echo "  Waiting for server... ($WAITED/$MAX_WAIT seconds)"
    done

    echo ""
    echo "Server startup timeout. It may still be starting in the background."
    echo "Check 'lsof -i :$PORT' or 'npm start' output."
fi
