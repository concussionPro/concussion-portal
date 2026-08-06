'use client'

/**
 * LAST-RESORT error boundary.
 *
 * app/error.tsx only catches throws from INSIDE the root layout's children —
 * it renders as a child of that layout, so it cannot catch a throw in the
 * layout itself (or in error.tsx). Without this file those cases fell through
 * to Next's built-in fallback, which in production is an unbranded white page
 * reading "Application error: a server-side exception has occurred" with a
 * digest and no way back into the site. Safe (Next never ships the stack to
 * the browser in production) but a dead end for a paying customer.
 *
 * global-error replaces the whole document, so it MUST render its own <html>
 * and <body>, and it cannot use the app's fonts/layout or next/link.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en-AU">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
            We hit an unexpected error loading this page. Please try again — if it
            keeps happening, email us and we&apos;ll sort it out.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                background: '#5b9aa6',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: '12px 24px',
                color: '#334155',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
              }}
            >
              Go to homepage
            </a>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '32px' }}>
            zac@concussion-education-australia.com
            {/* The digest is a non-sensitive Next-generated hash of the server
                error — quoting it lets a support email be matched to the exact
                log line. It is never the message or the stack. */}
            {error.digest ? ` · ref ${error.digest}` : ''}
          </p>
        </div>
      </body>
    </html>
  )
}
