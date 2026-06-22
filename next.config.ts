import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  // Redirects
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
        // everything EXCEPT /tools/* gets the strict, locked-down headers
        source: '/((?!tools/).*)',
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
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
