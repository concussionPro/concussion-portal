import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // The paid documents live OUTSIDE public/ (see app/docs/[...slug]/route.ts):
  // anything under public/ is served by the CDN, so a paywall keyed on the URL
  // protects the path and not the bytes. Two separate leaks in one day proved
  // the difference. Because private-docs/ is read at runtime rather than
  // imported, Next's tracer cannot see it and would ship a function that 404s
  // every paid download — so it is included explicitly, and ONLY for the one
  // route that serves it.
  outputFileTracingIncludes: {
    '/docs/[...slug]': ['./private-docs/**'],
  },

  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  // Redirects
  /**
   * Short pitch URLs. A REWRITE, not a redirect — the browser keeps showing
   * `/mscc` instead of bouncing to `/sst-pitch/mscc`, which matters when the
   * URL is read aloud or typed in front of the people it is named after.
   *
   * Listed one slug at a time on purpose. A catch-all `/:slug -> /sst-pitch/:slug`
   * would swallow every unmatched path in the app and turn genuine 404s into
   * prospect-page lookups.
   */
  async rewrites() {
    return [{ source: '/mscc', destination: '/sst-pitch/mscc' }]
  },

  async redirects() {
    return [
      {
        source: '/pricing/international',
        destination: '/pricing-international',
        permanent: true,
      },
      // Squarespace path redirects — catch traffic when SS pages redirect to portal domain
      { source: '/shop', destination: '/pricing', permanent: false },
      { source: '/concussion-course', destination: '/pricing', permanent: false },
      { source: '/scat-6-digital-tools', destination: '/scat-forms', permanent: false },
      { source: '/formsdl', destination: '/scat-forms', permanent: false },
      { source: '/allied', destination: '/pricing', permanent: false },
      { source: '/gp-portal', destination: '/pricing', permanent: false },
      { source: '/ty-page', destination: '/scat-mastery', permanent: false },
      { source: '/blog-1', destination: '/blog', permanent: false },
      { source: '/blog-1/:slug*', destination: '/blog', permanent: false },
      // Legacy trial page → SCAT Mastery (better UX: instant session vs magic link wall)
      { source: '/trial', destination: '/scat-mastery', permanent: true },
      // SST marketing funnel lives at the PUBLIC /sst namespace (owner
      // 2026-07-06) — the /platform variants were noindex. One canonical.
      // Public Clinical Testing suite funnel lives at /clinical-suite
      // (owner 2026-07-06: kill /platform, kill /sst). One canonical.
      { source: '/sst', destination: '/clinical-suite', permanent: false },
      { source: '/sst/:path*', destination: '/clinical-suite/:path*', permanent: false },
      { source: '/platform/founding', destination: '/clinical-suite/founding', permanent: false },
      { source: '/platform/pricing', destination: '/clinical-suite/pricing', permanent: false },
      { source: '/platform/evidence', destination: '/clinical-suite/evidence', permanent: false },
      { source: '/platform/clinicians', destination: '/clinical-suite', permanent: false },
      // The parent itself, missed when the four children above were redirected
      // on 2026-07-06 — so "kill /platform, one canonical" was three-quarters
      // done for a month. /platform kept serving a full 524-line marketing page
      // for the SAME product as /clinical-suite, with a DIFFERENT headline
      // ("Recovery, paced to your threshold." vs "You set the threshold."), no
      // inbound links from anywhere on the site, and 14 real visitors in 90 days
      // who arrived from Google or an old link and landed on the non-canonical
      // copy. Register C also spent this week correcting reference counts on
      // /platform/evidence — maintenance paid on a surface nobody can reach.
      // (2026-08-06, master clean register A pass 2.)
      //
      // EXACT match only: /platform/app is the installable PWA entry, is gated
      // in its own nested layout, and must keep serving. A ':path*' here would
      // break it.
      { source: '/platform', destination: '/clinical-suite', permanent: false },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        // Prevent Cloudflare from long-caching the Squarespace sync script
        source: '/squarespace-sync.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, must-revalidate' },
        ],
      },
      {
        // Tools suite (hidden, pre-launch): screen-comfort + future on-device eye tools.
        // These need the camera + the MediaPipe CDN, which the strict global policy below forbids.
        // Scoped narrowly to /tools/* so the rest of the site keeps the locked-down headers.
        source: '/tools/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // allow the camera on this origin only (global policy is camera=())
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // MediaPipe tasks-vision loads as an ES module + WASM (SIMD) from jsDelivr
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              // wasm binary from jsDelivr, face_landmarker .task model from Google storage
              "connect-src 'self' blob: data: https://cdn.jsdelivr.net https://storage.googleapis.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "media-src 'self' blob:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
      {
        // SST Trainer (PWA at /sst-trainer): the patient app needs the CAMERA
        // (PPG heart-rate) and Web Bluetooth (BLE HR straps) — both forbidden by
        // the strict global policy below. Same carve-out shape as /tools/*, but
        // we DON'T move the route under /tools because /sst-trainer is the PWA
        // start_url + the QR deep-link target.
        source: '/sst-trainer/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // camera for PPG, bluetooth for BLE HR straps (global policy is camera=())
          { key: 'Permissions-Policy', value: 'camera=(self), bluetooth=(self), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' blob: data: https://cdn.jsdelivr.net https://storage.googleapis.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "media-src 'self' blob:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
      {
        // Jurisdiction report HTML (/api/sst/report): the /acc pitch page embeds
        // the live sample ACC884 in a same-origin iframe as its proof artifact.
        // The global policy below is DENY / frame-ancestors 'none', which blocks
        // that embed — this narrow carve-out relaxes ONLY framing, only to self.
        // The route's own auth (clinic code + view key; DEMO00 keyless) is
        // unchanged; a report never renders cross-origin.
        source: '/api/sst/report',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self' data:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
      {
        // everything EXCEPT /tools/*, /sst-trainer and /api/sst/report gets the
        // strict, locked-down headers (each excluded route has its own scoped
        // block above — without the exclusion BOTH X-Frame-Options values would
        // be sent and browsers take the stricter DENY, breaking the /acc embed)
        source: '/((?!tools/|sst-trainer|api/sst/report).*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // bluetooth=(self): the clinician Connect-a-strap wizard (Clinical
            // Hub / clinical-testing) calls navigator.bluetooth.requestDevice —
            // a restrictive Permissions-Policy that omits `bluetooth` makes
            // Chrome/Brave reject it instantly (picker "flickers", never opens).
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), bluetooth=(self)'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://static.cloudflareinsights.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net",
              "font-src 'self' data:",
              "connect-src 'self' https://vercel.live https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://region1.google-analytics.com https://api.stripe.com https://checkout.stripe.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
              "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://js.stripe.com blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ]
  },
};

export default withBundleAnalyzer(nextConfig);
