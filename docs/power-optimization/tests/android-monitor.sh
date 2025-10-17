#!/bin/bash
# Android Integration Test Monitoring Script
# Helps automate log capture and analysis for Task 14

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="${HOME}/trendankara-test-logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="${LOG_DIR}/android-test-${TIMESTAMP}.log"
PACKAGE_NAME="com.trendankara"

# Create log directory
mkdir -p "${LOG_DIR}"

echo -e "${BLUE}=== Trend Ankara Android Integration Test ===${NC}"
echo -e "${BLUE}Task 14: Native Metadata Events Verification${NC}"
echo ""

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: ADB not found. Please install Android SDK Platform Tools.${NC}"
    exit 1
fi

# Check if device is connected
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}Error: No Android device connected.${NC}"
    echo "Please connect your device and enable USB debugging."
    exit 1
fi

DEVICE_MODEL=$(adb shell getprop ro.product.model)
ANDROID_VERSION=$(adb shell getprop ro.build.version.release)

echo -e "${GREEN}✓ Device connected: ${DEVICE_MODEL}${NC}"
echo -e "${GREEN}✓ Android version: ${ANDROID_VERSION}${NC}"
echo ""

# Function to print section header
print_section() {
    echo ""
    echo -e "${YELLOW}=====================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}=====================================${NC}"
    echo ""
}

# Verify app is installed
if ! adb shell pm list packages | grep -q "${PACKAGE_NAME}"; then
    echo -e "${RED}Error: Trend Ankara app not installed on device.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ App installed${NC}"
echo ""

# Menu selection
print_section "Test Options"
echo "1. Start test monitoring (20 minutes)"
echo "2. Quick verification (check platform detection)"
echo "3. Count HTTP requests (analyze logs)"
echo "4. Check battery stats"
echo "5. Monitor network traffic"
echo "6. Full test suite"
echo ""
read -p "Select option (1-6): " OPTION

case $OPTION in
    1)
        print_section "Starting Test Monitoring"
        echo "Test log will be saved to: ${LOG_FILE}"
        echo ""
        echo -e "${YELLOW}Instructions:${NC}"
        echo "1. Launch Trend Ankara app on your device"
        echo "2. Start playing radio"
        echo "3. Lock the device"
        echo "4. Let it run for 20 minutes"
        echo ""
        echo "Press Enter when ready to start monitoring..."
        read

        echo -e "${GREEN}Starting log capture...${NC}"
        echo "Press Ctrl+C to stop monitoring"
        echo ""

        # Clear logcat
        adb logcat -c

        # Monitor and save logs
        adb logcat | grep -E "(useNowPlaying|PlaybackService|TrackPlayerService)" | tee "${LOG_FILE}"
        ;;

    2)
        print_section "Quick Verification"
        echo "Checking for Android platform detection logs..."
        echo ""

        adb logcat -d | grep -E "(Android detected|Native ExoPlayer|skipping HTTP metadata polling)" | tail -20

        if adb logcat -d | grep -q "Android detected"; then
            echo ""
            echo -e "${GREEN}✓ Platform detection working correctly${NC}"
        else
            echo ""
            echo -e "${RED}✗ Platform detection logs not found${NC}"
            echo "Make sure the app is running and playing audio"
        fi
        ;;

    3)
        print_section "HTTP Request Analysis"
        echo "Analyzing logs for HTTP metadata requests..."
        echo ""

        HTTP_COUNT=$(adb logcat -d | grep "Fetching metadata from:" | wc -l)
        NATIVE_COUNT=$(adb logcat -d | grep "Metadata received from stream (Android)" | wc -l)

        echo "HTTP metadata requests: ${HTTP_COUNT}"
        echo "Native metadata events: ${NATIVE_COUNT}"
        echo ""

        if [ "$HTTP_COUNT" -eq 0 ]; then
            echo -e "${GREEN}✓ PASS: Zero HTTP requests (expected for Android)${NC}"
        else
            echo -e "${RED}✗ FAIL: Found ${HTTP_COUNT} HTTP requests (expected: 0)${NC}"
        fi

        if [ "$NATIVE_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ PASS: Native metadata events detected (${NATIVE_COUNT} events)${NC}"
        else
            echo -e "${YELLOW}⚠ WARNING: No native metadata events found${NC}"
            echo "This may be normal if no song changes occurred"
        fi
        ;;

    4)
        print_section "Battery Statistics"

        echo "Current battery status:"
        adb shell dumpsys battery
        echo ""

        echo "Battery stats for Trend Ankara:"
        adb shell dumpsys batterystats "${PACKAGE_NAME}" | head -50
        echo ""

        echo "To reset battery stats: adb shell dumpsys batterystats --reset"
        ;;

    5)
        print_section "Network Traffic Monitor"
        echo "This will capture network traffic to analyze HTTP requests"
        echo ""
        echo -e "${YELLOW}Note: Requires root or tcpdump on device${NC}"
        echo ""
        read -p "Continue? (y/n): " CONTINUE

        if [ "$CONTINUE" = "y" ]; then
            PCAP_FILE="/sdcard/trendankara-network-${TIMESTAMP}.pcap"
            echo "Capturing network traffic to: ${PCAP_FILE}"
            echo "Press Ctrl+C to stop capture"
            echo ""

            adb shell "tcpdump -i any -s 0 port 80 or port 443 -w ${PCAP_FILE}" &
            TCPDUMP_PID=$!

            trap "kill $TCPDUMP_PID 2>/dev/null; adb pull ${PCAP_FILE} ${LOG_DIR}/; echo 'Capture saved'; exit" INT

            wait $TCPDUMP_PID
        fi
        ;;

    6)
        print_section "Full Test Suite"
        echo "This will run a complete 20-minute test with analysis"
        echo ""
        echo -e "${YELLOW}Instructions:${NC}"
        echo "1. Make sure device is fully charged (or connected to charger)"
        echo "2. Close all other apps"
        echo "3. Launch Trend Ankara and start playing"
        echo "4. Lock the device when prompted"
        echo ""
        read -p "Press Enter when ready..."

        # Reset battery stats
        echo "Resetting battery stats..."
        adb shell dumpsys batterystats --reset > /dev/null 2>&1

        # Clear logs
        echo "Clearing logs..."
        adb logcat -c

        # Get initial battery level
        BATTERY_START=$(adb shell dumpsys battery | grep level | awk '{print $2}')
        TIME_START=$(date +%s)

        echo ""
        echo -e "${GREEN}Test started at $(date)${NC}"
        echo -e "${GREEN}Initial battery level: ${BATTERY_START}%${NC}"
        echo ""
        echo "Please lock your device now and leave it undisturbed for 20 minutes..."
        echo ""
        echo "Monitoring logs (Ctrl+C to stop early)..."
        echo ""

        # Monitor for 20 minutes (1200 seconds)
        timeout 1200 adb logcat | grep -E "(useNowPlaying|PlaybackService|TrackPlayerService)" | tee "${LOG_FILE}" || true

        # Get final battery level
        BATTERY_END=$(adb shell dumpsys battery | grep level | awk '{print $2}')
        TIME_END=$(date +%s)
        DURATION=$((TIME_END - TIME_START))
        BATTERY_DRAIN=$((BATTERY_START - BATTERY_END))

        echo ""
        print_section "Test Results"
        echo "Test completed at $(date)"
        echo "Duration: $((DURATION / 60)) minutes $((DURATION % 60)) seconds"
        echo "Battery drain: ${BATTERY_DRAIN}% (${BATTERY_START}% → ${BATTERY_END}%)"
        echo ""

        # Analyze logs
        HTTP_COUNT=$(grep -c "Fetching metadata from:" "${LOG_FILE}" || echo "0")
        NATIVE_COUNT=$(grep -c "Metadata received from stream (Android)" "${LOG_FILE}" || echo "0")
        ANDROID_DETECTED=$(grep -c "Android detected" "${LOG_FILE}" || echo "0")

        echo "=== Log Analysis ==="
        echo "HTTP metadata requests: ${HTTP_COUNT}"
        echo "Native metadata events: ${NATIVE_COUNT}"
        echo "Android detection logs: ${ANDROID_DETECTED}"
        echo ""

        # Verdict
        echo "=== Test Verdict ==="
        PASS=true

        if [ "$HTTP_COUNT" -eq 0 ]; then
            echo -e "${GREEN}✓ HTTP requests: PASS (0 requests)${NC}"
        else
            echo -e "${RED}✗ HTTP requests: FAIL (${HTTP_COUNT} requests, expected 0)${NC}"
            PASS=false
        fi

        if [ "$ANDROID_DETECTED" -gt 0 ]; then
            echo -e "${GREEN}✓ Platform detection: PASS${NC}"
        else
            echo -e "${RED}✗ Platform detection: FAIL${NC}"
            PASS=false
        fi

        if [ "$NATIVE_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ Native events: PASS (${NATIVE_COUNT} events)${NC}"
        else
            echo -e "${YELLOW}⚠ Native events: WARNING (0 events)${NC}"
            echo "  This may be normal if stream doesn't include metadata"
        fi

        # Battery drain check (rough estimate)
        if [ "$BATTERY_DRAIN" -lt 8 ]; then
            echo -e "${GREEN}✓ Battery drain: PASS (${BATTERY_DRAIN}% in 20 min)${NC}"
        else
            echo -e "${YELLOW}⚠ Battery drain: WARNING (${BATTERY_DRAIN}% in 20 min)${NC}"
            echo "  Expected <8% in 20 minutes"
        fi

        echo ""
        if [ "$PASS" = true ]; then
            echo -e "${GREEN}=== OVERALL: PASS ===${NC}"
        else
            echo -e "${RED}=== OVERALL: FAIL ===${NC}"
        fi

        echo ""
        echo "Full log saved to: ${LOG_FILE}"
        ;;

    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}=== Test Complete ===${NC}"
