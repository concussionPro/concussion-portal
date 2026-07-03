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

## Architecture decision — remote-URL shell + raw BLE plugin (KEEP)

Assessed 2026-07 for Capacitor 6. **Verdict: technically sound and shippable.**

**Does the bridge actually work on a page loaded via `server.url`?** Yes.
Capacitor injects `window.Capacitor` and every registered native plugin at the
**native webview layer**, not from the page — iOS adds a `WKUserScript` at
`documentStart`; Android exposes the `androidBridge` `@JavascriptInterface` and
evaluates `native-bridge.js` on page start. That injection happens on **remote
origins** just as on bundled assets. Plugin **method** calls travel over
`WKScriptMessageHandler` / the Android JS interface, and plugin **events**
(`addListener`, i.e. the per-device `notification|deviceId|service|characteristic`
callbacks this app relies on) come back via `evaluateJavaScript`. None of that
is subject to the page's CSP, and the bridge user-script runs before the page
CSP is applied. The proof point: Ionic/Capacitor **live-reload**
(`--livereload --external`) is literally `server.url` pointed at a remote LAN
host, and every plugin — including event-emitting ones — works under it. So
`window.Capacitor.Plugins.BluetoothLe`, its methods, AND its notification
listeners bridge correctly here.

**Why not bundle the web assets instead?** `/sst-trainer` is a route inside a
large Next 16 SSR app that calls **relative** `/api/sst/*` server routes in the
same deployment. Static-exporting one route out of an SSR app is impractical,
and even if done it would force every API call to an absolute
`https://portal.../api/...` origin — which introduces a **CORS** surface and a
second thing to keep in sync, for no user benefit. The remote-URL shell keeps
one codebase and ships web fixes without a store resubmission. That upside is
real; the cost is store-review exposure (below).

## App Store / Play review risk (read before submitting)

`server.url` apps draw Apple **Guideline 4.2 / 4.2.3** ("minimum functionality
/ repackaged website") scrutiny. Realistic verdict: **passable but not
automatic — reduce the risk deliberately.**

What defends this app: the native BLE is **genuine native functionality that the
website cannot deliver** — live heart-rate streaming from a watch/chest strap on
**iPhone, where Web Bluetooth does not exist at all**. The graded sub-symptom
test requires that live HR, so BLE is core to the primary function, not a
gimmick. That is a strong, honest 4.2 answer.

To improve the odds:
- In App Review notes, state plainly: the app streams live BLE heart rate via
  CoreBluetooth (a capability Safari/Web Bluetooth cannot provide on iOS) and
  drives a clinical graded-exercise workflow. Offer a demo video or a loaner
  device + a test clinic code — a reviewer with no paired strap sees only the
  web view and is more likely to reject.
- It is distributed to **clinics, not consumers**. Strongly consider Apple
  **Unlisted App Distribution** or a **Custom App via Apple Business Manager**
  — off the public store, lower 4.2 exposure, better fit for a clinical tool.
- Keep the BLE onboarding prominent so the native value is visible immediately.

**Google Play:** much more lenient on webview shells; the equivalent Minimum
Functionality policy rarely rejects an app with real BLE. Low risk. Note an
Android **TWA** already ships for the Chrome/Web-Bluetooth path — this Capacitor
Android target is only worth building if you want ONE native codebase across
both stores (see the TWA note further down).

## CSP, navigation & service worker (residual notes)

- **CSP:** the deployed site's strict Content-Security-Policy does **not** break
  the bridge — injection and the plugin call/event transport are native-layer
  and pre-CSP (see above). No CSP change is required for the app to work.
- **Navigation:** `server.allowNavigation` is scoped to the portal host, so the
  BLE session cannot be knocked off-origin by an in-app link. External links
  should open in the **system browser** (via `@capacitor/browser` or
  `target="_blank"` in the web layer) rather than navigating the app webview.
- **Service worker (`public/sw.js`):** intentionally left **inert** in the
  native shell. iOS WKWebView only runs a remote SW when app-bound domains are
  enabled — `ios.limitsNavigationsToAppBoundDomains` is deliberately **false** —
  and Capacitor's Android webview doesn't wire a `ServiceWorkerController`. So
  the SW does not register inside the app on either platform. That is the
  desired outcome: an SW caching the shell would fight `server.url`'s live-update
  advantage and could pin stale bridge JS. Consequence: the native app is
  **online-only**, which is fine — the clinical flow needs `/api/sst/*` live
  anyway. If offline shell caching is ever wanted, it must be a network-first SW
  that never caches the `/sst-trainer` document, plus app-bound-domains wiring.

## Config choices (capacitor.config.ts)

- `appId: au.com.concussioneducation.sst` — **kept.** Sane reverse-DNS,
  Android-legal (no hyphens), and registrable as-is (stores don't verify domain
  ownership for a bundle id; only Associated Domains / App Links would, and this
  app uses neither). It implies a `.com.au` domain CEA may not own — cosmetic
  only, no functional impact. **Do not change it once registered** — a new id is
  a new app listing.
- `appendUserAgent: 'SSTTrainerApp'` — lets the server/client detect the native
  shell reliably after SPA navigation, when the `?source=app` query is gone.
- `ios.limitsNavigationsToAppBoundDomains: false` and `android.allowMixedContent:
  false` — see the service-worker and https notes above.

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
