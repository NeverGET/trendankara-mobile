#!/bin/bash

# Android Power Profiling Script for Trend Ankara Mobile App
# This script collects battery stats, CPU usage, and network activity
# Run this while the app is playing audio in the background

PACKAGE_NAME="com.trendankara.mobile"
OUTPUT_DIR="./profiling-results"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

echo "========================================="
echo "Android Power Profiling - Trend Ankara"
echo "Package: $PACKAGE_NAME"
echo "Timestamp: $TIMESTAMP"
echo "========================================="
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# 1. Reset battery stats to get clean data
echo "[1/7] Resetting battery stats..."
adb shell dumpsys batterystats --reset
echo "✓ Battery stats reset"
echo ""

# 2. Wait for user to start test
echo "[2/7] Setup complete. Please:"
echo "  1. Start playing music in the app"
echo "  2. Lock the phone screen"
echo "  3. Wait for at least 5 minutes"
echo "  4. Press ENTER when ready to collect data"
read -p ""

# 3. Collect battery stats
echo "[3/7] Collecting battery stats..."
adb shell dumpsys batterystats "$PACKAGE_NAME" > "$OUTPUT_DIR/battery-stats-$TIMESTAMP.txt"
echo "✓ Battery stats saved to: $OUTPUT_DIR/battery-stats-$TIMESTAMP.txt"
echo ""

# 4. Collect battery history
echo "[4/7] Collecting battery history..."
adb shell dumpsys batterystats --checkin > "$OUTPUT_DIR/battery-history-$TIMESTAMP.txt"
echo "✓ Battery history saved to: $OUTPUT_DIR/battery-history-$TIMESTAMP.txt"
echo ""

# 5. Check for wake locks
echo "[5/7] Checking wake locks..."
adb shell dumpsys power | grep -A 20 "Wake Locks" > "$OUTPUT_DIR/wake-locks-$TIMESTAMP.txt"
echo "✓ Wake locks saved to: $OUTPUT_DIR/wake-locks-$TIMESTAMP.txt"
echo ""

# 6. Collect CPU usage
echo "[6/7] Collecting CPU usage..."
adb shell top -n 1 | grep "$PACKAGE_NAME" > "$OUTPUT_DIR/cpu-usage-$TIMESTAMP.txt"
echo "✓ CPU usage saved to: $OUTPUT_DIR/cpu-usage-$TIMESTAMP.txt"
echo ""

# 7. Collect network stats
echo "[7/7] Collecting network stats..."
adb shell dumpsys netstats | grep "$PACKAGE_NAME" > "$OUTPUT_DIR/network-stats-$TIMESTAMP.txt"
echo "✓ Network stats saved to: $OUTPUT_DIR/network-stats-$TIMESTAMP.txt"
echo ""

# Summary
echo "========================================="
echo "Data Collection Complete!"
echo "========================================="
echo ""
echo "Results saved in: $OUTPUT_DIR/"
echo ""
echo "Next steps:"
echo "  1. Review the collected data files"
echo "  2. Use Android Studio Profiler for detailed analysis:"
echo "     - Open Android Studio"
echo "     - Go to View > Tool Windows > Profiler"
echo "     - Click '+' and select the device"
echo "     - Select the Trend Ankara app process"
echo "     - Profile CPU, Memory, and Energy"
echo "  3. Compare with similar apps (YouTube Music, Spotify)"
echo ""
echo "For detailed battery analysis, you can use:"
echo "  adb bugreport > bugreport-$TIMESTAMP.zip"
echo "  Then open the bugreport in Android Studio's Battery Historian"
echo ""
