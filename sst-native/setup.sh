#!/usr/bin/env bash
# One-shot native setup for the SST Trainer wearables app.
# Run on your Mac AFTER installing Xcode (App Store) + Android Studio.
#   cd sst-native && ./setup.sh
# Then: npm run open:ios   (set your Team, Run on a device with your Garmin)
#       npm run open:android
set -euo pipefail
cd "$(dirname "$0")"

echo "› installing deps…"
npm install --no-audit --no-fund

echo "› adding native platforms (idempotent)…"
[ -d ios ]     || npx cap add ios
[ -d android ] || npx cap add android

# ── iOS: Bluetooth usage strings (App Store rejects BLE apps without these) ──
PLIST="ios/App/App/Info.plist"
if [ -f "$PLIST" ] && ! grep -q NSBluetoothAlwaysUsageDescription "$PLIST"; then
  echo "› patching iOS Info.plist Bluetooth strings…"
  /usr/libexec/PlistBuddy -c \
    'Add :NSBluetoothAlwaysUsageDescription string "SST Trainer reads your heart rate live from your watch or chest strap during the graded test and training sessions."' "$PLIST"
  /usr/libexec/PlistBuddy -c \
    'Add :NSBluetoothPeripheralUsageDescription string "SST Trainer reads your heart rate live from your watch or chest strap."' "$PLIST"
fi

# ── Android: BLE permissions ────────────────────────────────────────────────
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ] && ! grep -q BLUETOOTH_CONNECT "$MANIFEST"; then
  echo "› patching AndroidManifest BLE permissions…"
  perl -0pi -e 's/(<manifest[^>]*>)/$1\n    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" \/>\n    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" \/>\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" \/>\n    <uses-feature android:name="android.hardware.bluetooth_le" android:required="true" \/>/' "$MANIFEST"
fi

echo "› syncing…"
npx cap sync

echo
echo "✓ Native projects ready."
echo "  iOS:     npm run open:ios     (Xcode → set Team → Run on device)"
echo "  Android: npm run open:android (Android Studio → Run on device)"
echo "  Smoke test: watch in broadcast mode → pair in onboarding → live pulse."
