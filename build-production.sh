#!/bin/bash

echo "🚀 Building TrendAnkara Mobile App for Production"
echo "=================================================="
echo ""

# Build for Android
echo "📱 Starting Android build..."
echo "This will create an APK file that you can install on your Android phone"
echo ""
eas build --platform android --profile production

echo ""
echo "=================================================="
echo ""

# Build for iOS
echo "🍎 Starting iOS build..."
echo "This will create an IPA file for your friend's iOS device"
echo ""
eas build --platform ios --profile production

echo ""
echo "=================================================="
echo "✅ Build process completed!"
echo ""
echo "To check build status: eas build:list"
echo "To download builds: eas build:download"