#!/usr/bin/env bash
# Launch the SST Trainer watch app in the simulator (POST-REBOOT resume).
#
# Context: the watchOS app is BUILT and committed. The only blocker was a
# corrupted/unregistered watchOS simulator runtime — a Mac reboot re-mounts and
# re-registers it (no re-download; the ~4GB is already on disk). After the
# reboot, run this from the repo:  bash sst-watch/launch-sim.sh
#
# It builds (if needed), creates a watch sim, boots it, installs + launches the
# app. Clinic code for the demo flow: DEMO00. The simulator has no HR sensor —
# live heart rate + haptics only work on a physical Apple Watch.
set -x
cd "$(dirname "$0")"

export JAVA_HOME=$(brew --prefix openjdk@17 2>/dev/null)/libexec/openjdk.jdk/Contents/Home

# 0. sanity: is the watch runtime registered now (should be, after reboot)?
if ! xcrun simctl list runtimes 2>/dev/null | grep -qi watchos; then
  echo "!! watchOS runtime still not registered. If this is right after a reboot"
  echo "!! and it's still missing, the runtime download is genuinely broken —"
  echo "!! re-get it in Xcode > Settings > Components (watchOS Simulator)."
  exit 3
fi

# 1. ensure the project + build exist
command -v xcodegen >/dev/null || brew install xcodegen
[ -d SSTWatch.xcodeproj ] || xcodegen generate
APP=$(find ~/Library/Developer/Xcode/DerivedData -name "SSTWatch.app" -path "*watchsimulator*" 2>/dev/null | head -1)
if [ -z "$APP" ]; then
  xcodebuild -project SSTWatch.xcodeproj -scheme SSTWatch -sdk watchsimulator \
    -configuration Debug -destination 'generic/platform=watchOS Simulator' \
    build CODE_SIGNING_ALLOWED=NO
  APP=$(find ~/Library/Developer/Xcode/DerivedData -name "SSTWatch.app" -path "*watchsimulator*" 2>/dev/null | head -1)
fi
echo "APP=$APP"

# 2. reuse an existing "SST Watch" sim or create one
SIM=$(xcrun simctl list devices 2>/dev/null | grep "SST Watch" | grep -oE "[0-9A-F-]{36}" | head -1)
if [ -z "$SIM" ]; then
  SIM=$(xcrun simctl create "SST Watch" "Apple Watch Series 10 (46mm)" 2>&1 | tail -1)
fi
echo "SIM=$SIM"
case "$SIM" in *nvalid*|*rror*|"") echo "CREATE_FAILED — runtime still unusable"; exit 4;; esac

# 3. boot + launch
xcrun simctl boot "$SIM" 2>/dev/null
open -a Simulator
sleep 14
xcrun simctl install "$SIM" "$APP"
xcrun simctl launch "$SIM" au.com.concussioneducation.sst.watchkitapp
echo "LAUNCHED — SST onboarding should be on screen. Clinic code: DEMO00"
