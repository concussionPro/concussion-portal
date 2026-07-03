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
# Each key is guarded INDEPENDENTLY: PlistBuddy `Add` errors on a duplicate key
# (fatal under `set -e`), and a half-completed prior run could leave only one of
# the two strings present. add_plist_string is a no-op when the key exists, so
# the whole block is safely idempotent and self-healing.
PLIST="ios/App/App/Info.plist"
add_plist_string() { # $1=key  $2=value
  grep -q "$1" "$PLIST" || /usr/libexec/PlistBuddy -c "Add :$1 string \"$2\"" "$PLIST"
}
if [ -f "$PLIST" ]; then
  echo "› ensuring iOS Info.plist Bluetooth strings…"
  add_plist_string NSBluetoothAlwaysUsageDescription \
    "SST Trainer reads your heart rate live from your watch or chest strap during the graded test and training sessions."
  add_plist_string NSBluetoothPeripheralUsageDescription \
    "SST Trainer reads your heart rate live from your watch or chest strap."
fi

# ── Android: BLE permissions ────────────────────────────────────────────────
# Idempotent: guarded on BLUETOOTH_CONNECT (the four lines are inserted as one
# block, so its presence means the patch already ran). The `[^>]*` class spans
# the multi-line, multi-attribute real <manifest …> open tag (newlines are not
# excluded), and we insert right after its first `>`.
#
# RUNTIME PERMISSIONS (orchestrator note — do NOT edit hr-live.ts): declaring
# BLUETOOTH_SCAN / BLUETOOTH_CONNECT in the manifest is necessary but NOT
# sufficient on Android 12+ (API 31+). The OS only shows the "Nearby devices"
# runtime prompt when the app actually requests it. @capacitor-community/
# bluetooth-le raises that prompt from initialize()/requestDevice()/
# requestLEScan(). lib/sst-trainer/hr-live.ts (connectNativeBleHr) already calls
# plugin.initialize() then plugin.requestDevice({ services:[HR] }) on the pair
# tap — that user gesture is what triggers the prompt, so no extra wiring is
# needed. If a future plugin version returns without prompting, call
# BluetoothLe.requestLEScan() once before requestDevice — but that belongs in
# hr-live.ts, which another agent owns.
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ] && ! grep -q BLUETOOTH_CONNECT "$MANIFEST"; then
  echo "› patching AndroidManifest BLE permissions…"
  perl -0pi -e 's/(<manifest[^>]*>)/$1\n    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" \/>\n    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" \/>\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" \/>\n    <uses-feature android:name="android.hardware.bluetooth_le" android:required="true" \/>/' "$MANIFEST"
  grep -q BLUETOOTH_CONNECT "$MANIFEST" || { echo "✗ AndroidManifest patch failed — <manifest> tag not matched"; exit 1; }
fi

echo "› syncing…"
npx cap sync

echo
echo "✓ Native projects ready."
echo "  iOS:     npm run open:ios     (Xcode → set Team → Run on device)"
echo "  Android: npm run open:android (Android Studio → Run on device)"
echo "  Smoke test: watch in broadcast mode → pair in onboarding → live pulse."
