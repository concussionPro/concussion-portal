import type { Metadata } from 'next'
import { QUARTERLY_PRACTICAL_BLAST } from '@/lib/email-sequences'
import { CONFIG } from '@/lib/config'

/**
 * EMAIL PREVIEW — renders the blast exactly as a recipient receives it.
 *
 * Resend has no draft state for API sends: the API sends immediately, and
 * "drafts" exist only for Broadcasts, which this system does not use. So there
 * is nothing to look at in the Resend dashboard until something has already
 * gone out — which is too late to review it.
 *
 * This is the review surface instead. It renders the real template with the
 * real CONFIG figures, so what is on screen is what would be delivered.
 *
 * ?segment=other switches to the opening used for people who never registered
 * interest — the two are materially different sentences and both need reading.
 *
 * noindex, and it sends nothing. The send path is
 * /api/admin/quarterly-practical-blast, which is dry-run on both verbs and
 * requires a hardcoded confirm flag.
 */

export const metadata: Metadata = {
  title: 'Blast preview — internal',
  robots: { index: false, follow: false },
}

export default async function BlastPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>
}) {
  const { segment } = await searchParams
  const registered = segment !== 'other'
  const link = `${CONFIG.APP_URL}/pricing`

  const html = QUARTERLY_PRACTICAL_BLAST.template('Sarah', registered, link, link)
    .replaceAll('{{unsubscribe_url}}', '#unsubscribe-example')

  return (
    <main style={{ minHeight: '100vh', background: '#f4f8f8', padding: '28px 16px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#0d7377', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          Email preview · nothing is sent from this page
        </p>
        <h1 style={{ margin: '4px 0 10px', fontSize: 24, fontWeight: 700, color: '#16282b', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          {QUARTERLY_PRACTICAL_BLAST.subject}
        </h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          <a
            href="/preview/blast"
            style={{
              flex: 1, textAlign: 'center', padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
              background: registered ? '#0d7377' : '#fff',
              color: registered ? '#fff' : '#4a6a6e',
              border: registered ? 'none' : '1px solid #cfe3e4',
            }}
          >
            Registered-interest segment
          </a>
          <a
            href="/preview/blast?segment=other"
            style={{
              flex: 1, textAlign: 'center', padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
              background: !registered ? '#0d7377' : '#fff',
              color: !registered ? '#fff' : '#4a6a6e',
              border: !registered ? 'none' : '1px solid #cfe3e4',
            }}
          >
            Everyone else
          </a>
        </div>

        <p style={{ margin: '0 0 14px', padding: '10px 13px', borderRadius: 9, border: '1px solid #e0c3ad', background: '#fbf0e8', color: '#6b3a1c', fontSize: 13, lineHeight: 1.55, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          <strong>Melbourne 31 October is not in CONFIG yet.</strong> Both buttons currently point at
          /pricing, which does not show that date. Set the date before this sends, or the first click
          lands somewhere that contradicts the email.
        </p>

        <div style={{ border: '1px solid #dcebeb', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <p style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.6, color: '#4a6a6e', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          Audience counts and the send path live at{' '}
          <code style={{ fontSize: 12 }}>/api/admin/quarterly-practical-blast</code> — dry run on both
          GET and POST. It cannot send without the confirm flag.
        </p>
      </div>
    </main>
  )
}
