import type { CapacitorConfig } from '@capacitor/cli'

/**
 * SST Trainer — native app shell (iOS + Android).
 *
 * One codebase: the shell loads the LIVE web app from `server.url` and injects
 * the Capacitor bridge, so the deployed /sst-trainer runs natively and gains
 * real Bluetooth via the community BLE plugin. The web app detects the native
 * bridge (window.Capacitor.Plugins.BluetoothLe) and pairs any wearable that
 * broadcasts the standard heart-rate profile — Garmin, WHOOP, Polar, Coros,
 * Suunto, Wahoo, chest straps — on BOTH platforms, including iPhone where
 * Apple does not ship Web Bluetooth.
 *
 * Ship channel: point server.url at production. For local device testing
 * against a dev server, override with a LAN URL (see README).
 */
const config: CapacitorConfig = {
  appId: 'au.com.concussioneducation.sst',
  appName: 'SST Trainer',
  // No local web assets — the shell serves the live deployment.
  webDir: 'www',
  server: {
    url: 'https://portal.concussion-education-australia.com/sst-trainer?source=app',
    // Keep in-app navigation on our own origin; everything else opens in the
    // system browser.
    allowNavigation: ['portal.concussion-education-australia.com'],
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    // BLE scanning is unreliable if the webview can navigate away; the
    // allowNavigation list above keeps the session on our origin.
  },
  plugins: {
    // @capacitor-community/bluetooth-le — no extra config needed; iOS/Android
    // permission strings live in Info.plist / AndroidManifest (see README).
  },
}

export default config
