# Scripts Documentation

## android-install.sh

**Purpose**: Fixes transient Android APK installation failures during development

**Problem Solved**:
- Addresses intermittent ADB installation failures with exit code 1
- Handles race conditions between build completion and emulator readiness
- Provides automatic retry mechanism with exponential backoff

**Usage**:

```bash
# Standard installation with retry logic
npm run android:install

# Clean installation (removes previous app first)
npm run android:install-clean

# Direct script usage with custom APK path
./scripts/android-install.sh path/to/your.apk
```

**Features**:
- ✅ Automatic retry (up to 3 attempts)
- ✅ Exponential backoff (1s, 2s, 4s delays)
- ✅ Pre-installation cleanup option
- ✅ Emulator detection
- ✅ Colored output for better visibility
- ✅ Error handling and user feedback

**Configuration**:
- `MAX_RETRIES=3` - Number of installation attempts
- `INITIAL_DELAY=1` - Starting delay in seconds
- `PACKAGE_NAME="com.anonymous.mobile"` - App package identifier
- `CLEAN_INSTALL=true` - Environment variable for clean installation

**When to Use**:
- When encountering "adb: failed to install" errors
- During automated build processes
- For consistent development workflow
- In CI/CD pipelines

**Troubleshooting**:
If the script fails after all retries:
1. Check emulator is fully booted: `adb devices`
2. Verify APK exists at the specified path
3. Manually install: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
4. Check emulator storage: `adb shell df /data`
5. Restart emulator if necessary