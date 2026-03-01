import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { CONFIG } from "@/lib/config";
import { organizationSchema } from "@/lib/schema-markup";
import Script from 'next/script';

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
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Ads Conversion Tracking (AW-17984048021) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17984048021"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tracking" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17984048021');
          `}
        </Script>

        {/* Umami Analytics */}
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="78007a9523265d8a53b15efc8457b60c2f3394d2d5ad0259a38761afb69a02d3"
          strategy="afterInteractive"
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
        <ProgressProvider>
          <AnalyticsProvider>
            <div id="main-content">
              {children}
            </div>
          </AnalyticsProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
