import type { CapacitorConfig } from '@capacitor/cli'

/**
 * SST Trainer — native app shell (iOS + Android).
 *
 * ARCHITECTURE (assessed & confirmed viable, Capacitor 6):
 * One codebase. The shell loads the LIVE web app from `server.url` and the
 * native layer injects the Capacitor runtime + registered plugins into that
 * remote page. Capacitor injects the bridge at the NATIVE webview level
 * (iOS: a `WKUserScript` at documentStart; Android: the `androidBridge`
 * `@JavascriptInterface` + native-bridge.js on page start), so it is present
 * on remote origins exactly as it is on bundled assets — this is the same
 * mechanism Ionic/Capacitor live-reload relies on (`--livereload --external`
 * points server.url at a LAN host and every plugin, including event emitters,
 * keeps working). Plugin METHOD calls travel over WKScriptMessageHandler /
 * the JS interface and plugin EVENTS (addListener) come back via
 * evaluateJavaScript — neither path is subject to the page's CSP, and the
 * bridge user-script is injected before the page CSP applies. So
 * `window.Capacitor.Plugins.BluetoothLe`, its methods, and its per-device
 * `notification|...` listeners all bridge correctly on this remote page.
 *
 * The web app (lib/sst-trainer/hr-live.ts → connectNativeBleHr) detects the
 * bridge and pairs any wearable broadcasting the standard heart-rate profile
 * on BOTH platforms, including iPhone where Apple ships no Web Bluetooth.
 *
 * Ship channel: server.url points at production. For on-device testing against
 * a dev server, override with a LAN URL + server.cleartext (see README).
 */
const config: CapacitorConfig = {
  // Reverse-DNS app id. Sane and registrable (App Store / Play do NOT verify
  // domain ownership for a bundle id — only Associated Domains / App Links do,
  // which this app does not use). Android-legal (no hyphens). Keep this stable
  // once registered in App Store Connect / Play Console: changing it mints a
  // brand-new app listing.
  appId: 'au.com.concussioneducation.sst',
  appName: 'SST Trainer',
  // No local web assets — the shell serves the live deployment. postinstall
  // still writes a placeholder www/ so `cap sync` has a webDir to copy.
  webDir: 'www',
  // Lets the deployed /sst-trainer reliably know it is running inside the
  // native shell even after client-side navigation loses the ?source=app query
  // (UA marker survives SPA route changes; the query param does not).
  appendUserAgent: 'SSTTrainerApp',
  server: {
    url: 'https://portal.concussion-education-australia.com/sst-trainer?source=app',
    // Android hygiene: serve the (placeholder) local assets over https, never
    // http; the live content is https regardless.
    androidScheme: 'https',
    // Keep in-app navigation on our own origin. Anything off-origin is handled
    // outside the app-bound webview (open external links in the system browser
    // from the web layer via @capacitor/browser or target=_blank).
    allowNavigation: ['portal.concussion-education-australia.com'],
  },
  ios: {
    contentInset: 'always',
    // Leave app-bound domains OFF. Setting this true (with WKAppBoundDomains in
    // Info.plist) is what would let the site's service worker run in WKWebView —
    // we deliberately do NOT want that: an SW caching the shell would defeat the
    // whole point of server.url (live updates) and could serve stale bridge JS.
    // With this false, WKWebView does not run the remote SW, so there is no
    // stale-cache conflict; the app is simply online-only (the clinical flow
    // needs /api/sst/* anyway).
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    // Live content is https end to end; never silently load mixed http content.
    allowMixedContent: false,
    // BLE scanning is unreliable if the webview can navigate away; the
    // server.allowNavigation list above keeps the session on our origin.
  },
  plugins: {
    // @capacitor-community/bluetooth-le — configured at runtime via
    // BluetoothLe.initialize() (androidNeverForLocation, display strings), so no
    // config block is needed here. iOS/Android permission strings live in
    // Info.plist / AndroidManifest — see README.
  },
}

export default config
