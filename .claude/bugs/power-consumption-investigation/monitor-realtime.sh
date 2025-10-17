#!/bin/bash

# Real-time Network and CPU Monitoring Script
# Run this in a separate terminal while testing

PACKAGE_NAME="com.trendankara.mobile"
LOG_FILE=".claude/bugs/power-consumption-investigation/profiling-results/realtime-monitor.log"

echo "========================================="
echo "Real-Time Power Monitoring - Trend Ankara"
echo "Package: $PACKAGE_NAME"
echo "Started: $(date)"
echo "========================================="
echo ""
echo "Monitoring network activity and CPU usage..."
echo "Press Ctrl+C to stop"
echo ""
echo "Log file: $LOG_FILE"
echo ""

# Create log file with header
cat > "$LOG_FILE" << EOF
Real-Time Monitoring Log
Started: $(date)
Package: $PACKAGE_NAME

EOF

# Monitor loop
COUNTER=0
while true; do
    TIMESTAMP=$(date +"%H:%M:%S")
    COUNTER=$((COUNTER + 1))

    # Get network stats
    NETWORK_STATS=$(adb shell dumpsys netstats | grep "$PACKAGE_NAME" | head -1)

    # Get CPU usage
    CPU_USAGE=$(adb shell top -n 1 | grep "$PACKAGE_NAME" | head -1)

    # Display in terminal
    echo "[$TIMESTAMP] Sample #$COUNTER"
    echo "  Network: $NETWORK_STATS"
    echo "  CPU: $CPU_USAGE"
    echo ""

    # Append to log
    echo "[$TIMESTAMP] Sample #$COUNTER" >> "$LOG_FILE"
    echo "  Network: $NETWORK_STATS" >> "$LOG_FILE"
    echo "  CPU: $CPU_USAGE" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Wait 5 seconds (matching polling interval)
    sleep 5
done
