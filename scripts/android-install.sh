#!/bin/bash

# Android APK Installation Script with Retry Logic
# Fixes transient ADB installation failures during Expo development
# Bug reference: .claude/bugs/android-emulator-install-failure

set -e

# Configuration
MAX_RETRIES=3
INITIAL_DELAY=1  # seconds
PACKAGE_NAME="com.anonymous.mobile"
APK_PATH="${1:-android/app/build/outputs/apk/debug/app-debug.apk}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_msg() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if emulator is running
check_emulator() {
    local devices=$(adb devices | grep -c "emulator-" || true)
    if [ "$devices" -eq 0 ]; then
        print_msg "$RED" "❌ No Android emulator detected. Please start an emulator first."
        exit 1
    fi
    print_msg "$GREEN" "✓ Emulator detected"
}

# Function to perform pre-installation cleanup
cleanup_previous_installation() {
    print_msg "$YELLOW" "🧹 Cleaning up previous installation..."

    # Try to uninstall the app if it exists (ignore errors)
    adb uninstall "$PACKAGE_NAME" 2>/dev/null || true

    # Clear package manager cache
    adb shell pm clear "$PACKAGE_NAME" 2>/dev/null || true

    print_msg "$GREEN" "✓ Cleanup complete"
}

# Function to install APK with retry logic
install_with_retry() {
    local retry_count=0
    local delay=$INITIAL_DELAY

    while [ $retry_count -lt $MAX_RETRIES ]; do
        print_msg "$YELLOW" "📱 Installing APK (attempt $((retry_count + 1))/$MAX_RETRIES)..."

        # Try to install the APK
        if adb install -r -d --user 0 "$APK_PATH" 2>&1; then
            print_msg "$GREEN" "✅ APK installed successfully!"
            return 0
        else
            retry_count=$((retry_count + 1))

            if [ $retry_count -lt $MAX_RETRIES ]; then
                print_msg "$YELLOW" "⚠️  Installation failed. Retrying in ${delay} seconds..."
                sleep $delay

                # Exponential backoff
                delay=$((delay * 2))

                # Try cleanup between retries
                if [ $retry_count -eq 2 ]; then
                    print_msg "$YELLOW" "🔄 Performing cleanup before final retry..."
                    cleanup_previous_installation
                fi
            fi
        fi
    done

    print_msg "$RED" "❌ Failed to install APK after $MAX_RETRIES attempts"
    return 1
}

# Main execution
main() {
    print_msg "$GREEN" "=== Android APK Installation Script ==="

    # Check if APK file exists
    if [ ! -f "$APK_PATH" ]; then
        print_msg "$RED" "❌ APK file not found at: $APK_PATH"
        print_msg "$YELLOW" "Please build the app first or provide the correct APK path"
        exit 1
    fi

    # Check emulator status
    check_emulator

    # Optional: Cleanup previous installation
    if [ "${CLEAN_INSTALL:-false}" == "true" ]; then
        cleanup_previous_installation
    fi

    # Install with retry logic
    if install_with_retry; then
        print_msg "$GREEN" "🎉 Installation completed successfully!"
        print_msg "$YELLOW" "You can now launch the app on your emulator"
        exit 0
    else
        print_msg "$RED" "Installation failed. Manual troubleshooting may be required."
        print_msg "$YELLOW" "Try running: adb install -r $APK_PATH"
        exit 1
    fi
}

# Run the main function
main "$@"