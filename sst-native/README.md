# SST Trainer — native app shell (iOS + Android)

Turns the SST Trainer web app into real App Store / Google Play apps that pair
**any wearable broadcasting the standard Bluetooth heart-rate profile** —
Garmin, WHOOP, Polar, Coros, Suunto, Wahoo, chest straps — on **both**
platforms, including iPhone (where Apple does not ship Web Bluetooth).

## How it works

- The shell loads the **live** web app (`server.url` in `capacitor.config.ts`)
  and injects the Capacitor bridge. One web codebase; no duplicate app.
- Native Bluetooth comes from `@capacitor-community/bluetooth-le`. The web app
  detects the native bridge and routes pairing through it
  (`lib/sst-trainer/hr-live.ts` → `connectNativeBleHr`). On Android Chrome /
  desktop Chrome it uses Web Bluetooth instead — same standard HR profile,
  same code path.
- Apple Watch and Fitbit do **not** broadcast standard BLE heart rate → those
  users stay on manual entry (a HealthKit companion is a later, separate track).

## Build it (on the Mac — needs Xcode + Android Studio)

```bash
cd sst-native
npm install                # also writes a placeholder www/ (shell uses server.url)
npm run add:ios            # scaffolds ios/  (first time only)
npm run add:android        # scaffolds android/ (first time only)
npm run sync               # copies config + plugins into the native projects
```

### iOS — required Info.plist keys (add after `add:ios`)
`ios/App/App/Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>SST Trainer reads your heart rate live from your watch or chest strap during the graded test and training sessions.</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>SST Trainer reads your heart rate live from your watch or chest strap.</string>
```
Then: `npm run open:ios`, set the Team to your Apple Developer org (DUNS-enrolled),
pick a bundle id, and Run on a device with your Garmin in broadcast mode.

### Android — required permissions (add after `add:android`)
`android/app/src/main/AndroidManifest.xml` (inside `<manifest>`):
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
<uses-feature android:name="android.hardware.bluetooth_le" android:required="true" />
```
Then: `npm run open:android`, Run on a device.

> Android already reads the Garmin today via the existing Play TWA package
> (Chrome-based → Web Bluetooth). This Capacitor Android target is the option
> if you want ONE native codebase across both stores instead of TWA + Capacitor.

## On-device smoke test (do this first, with your Garmin)

1. Watch: turn on **Broadcast Heart Rate**.
2. Launch the app → onboarding → choose **Watch or heart-rate sensor (Bluetooth)**.
3. The OS device picker lists your Garmin → pick it → live pulse appears at the top.
4. Run the guided test; confirm HR streams and the band lands on your threshold.

If the picker is empty: the watch isn't broadcasting, or (Android) location is
off. If pairing works but no bpm: confirm the watch is on the standard HR
broadcast (not ANT+ only).

## Submit

- **iOS:** Xcode → Product → Archive → Distribute → App Store Connect. Privacy
  nutrition label must declare **Health/Fitness → Heart rate** and, in clinic
  mode, **Contact info → Name**. Privacy policy URL:
  `https://portal.concussion-education-australia.com/sst-privacy`.
- **Android:** `open:android` → Build → Generate Signed Bundle (.aab) → Play
  Console. Data safety form: heart-rate + name (clinic mode); same policy URL.
- App-store copy, icons and screenshots: `~/Documents/SS Trainer/`.

## Point at a dev server for local testing

Temporarily set `server.url` to your machine's LAN address, e.g.
`http://192.168.x.x:3789/sst-trainer?clinic=DEMO00`, add
`server.cleartext: true` for http, `npm run sync`, rebuild. Revert to the
production URL before archiving.
