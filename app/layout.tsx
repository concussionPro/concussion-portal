import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { FooterWrapper } from "@/components/FooterWrapper";
import { StickyCTA } from "@/components/StickyCTA";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { Analytics } from "@vercel/analytics/next";
import { CONFIG } from "@/lib/config";
import { organizationSchema } from "@/lib/schema-markup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
}

export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.SEO.SITE_URL),
  title: {
    default: 'Concussion Management Course Australia | SCAT6 & VOMS Training',
    template: '%s | ConcussionPro',
  },
  description: CONFIG.SEO.DESCRIPTION,
  keywords: [
    'concussion management course',
    'SCAT6 training',
    'VOMS protocol',
    'AHPRA CPD',
    'concussion assessment',
    'return to play protocol',
    'concussion course Australia',
    'clinical concussion management',
    'BESS testing',
    'vestibular assessment',
  ],
  authors: [{ name: 'Concussion Education Australia' }],
  creator: 'Concussion Education Australia',
  publisher: 'Concussion Education Australia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: CONFIG.SEO.SITE_URL,
    siteName: CONFIG.SEO.SITE_NAME,
    title: 'Concussion Management Course Australia | SCAT6 & VOMS Training',
    description: CONFIG.SEO.DESCRIPTION,
    images: [
      {
        url: CONFIG.SEO.OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'ConcussionPro - Professional Concussion Management Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concussion Management Course Australia | SCAT6 & VOMS Training',
    description: CONFIG.SEO.DESCRIPTION,
    images: [CONFIG.SEO.OG_IMAGE],
    creator: CONFIG.SEO.TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  // Google Search Console verification
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  // Canonical URLs are set per-page in their own layout.tsx files.
  // Omitted here to avoid root layout setting a homepage canonical on all pages.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <head>
        {/* Preconnect to Google Tag Manager for faster gtag.js loading */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/*
          Google tag (gtag.js) — loaded with Google Ads ID so the Ads
          verification crawler finds it in the raw server-rendered HTML.
          GA4 still works via gtag('config', 'G-LRDRZBWJ2E') below.

          IMPORTANT: Must be a plain <script> tag, NOT next/script with
          afterInteractive, because Google's Ads tag verification checks
          static HTML — afterInteractive injects via JS after hydration
          and the crawler never sees it ("Misconfigured" status).
        */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17984048021"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LRDRZBWJ2E');gtag('config','AW-17984048021');`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-accent focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        {/* Floating brain accents — subtle, GPU-composited, aria-hidden */}
        <div className="floating-brains" aria-hidden="true">
          <span className="brain-accent-1"></span>
          <span className="brain-accent-2"></span>
        </div>
        <ProgressProvider>
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <div id="main-content">
                {children}
              </div>
              <FooterWrapper />
              <StickyCTA />
              <ExitIntentPopup />
            </AnalyticsProvider>
          </Suspense>
        </ProgressProvider>
        <Analytics />
      </body>
    </html>
  );
}
