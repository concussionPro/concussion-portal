import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request data deletion — SST Trainer / Concussion Education Australia',
  description:
    'How to request deletion of your data from SST Trainer and Concussion Education Australia services.',
}

/**
 * /delete-my-data — the public data-deletion request page (Google Play data
 * safety "delete data URL"; also linked for Apple/APP compliance). Plain,
 * static, and truthful: deletion is by request to the listed contact, actioned
 * within 30 days.
 */
export default function DeleteMyDataPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em] text-[#16243f]">
        Request deletion of your data
      </h1>
      <p className="mt-4 text-[15px] leading-[1.65] text-slate-600">
        This page covers the <strong>SST Trainer</strong> app and Concussion Education Australia
        services. You can request deletion of your data at any time — you do not need an account
        to make the request.
      </p>

      <h2 className="mt-8 text-[18px] font-bold text-[#16243f]">How to request deletion</h2>
      <p className="mt-2 text-[15px] leading-[1.65] text-slate-600">
        Email{' '}
        <a href="mailto:zac@concussion-education-australia.com" className="font-semibold text-teal-700 underline">
          zac@concussion-education-australia.com
        </a>{' '}
        with the subject line <em>&ldquo;Data deletion request&rdquo;</em> and include:
      </p>
      <ul className="mt-3 list-disc pl-6 text-[15px] leading-[1.65] text-slate-600">
        <li>The name you used in the app (your patient label), and</li>
        <li>Your clinic code, if you know it (this helps us locate your records faster).</li>
      </ul>

      <h2 className="mt-8 text-[18px] font-bold text-[#16243f]">What gets deleted</h2>
      <ul className="mt-3 list-disc pl-6 text-[15px] leading-[1.65] text-slate-600">
        <li>Your session records (heart-rate readings, symptom responses, session summaries)</li>
        <li>Your patient label (name) and any device pairing preferences</li>
        <li>Any de-identified service-improvement data you consented to, if you revoke that consent</li>
      </ul>
      <p className="mt-3 text-[15px] leading-[1.65] text-slate-600">
        Note: reports already filed into your clinic&rsquo;s own practice-management system are part
        of your clinician&rsquo;s health record and are governed by their record-keeping obligations —
        contact your clinic about those.
      </p>

      <h2 className="mt-8 text-[18px] font-bold text-[#16243f]">Timeframe</h2>
      <p className="mt-2 text-[15px] leading-[1.65] text-slate-600">
        We confirm receipt and action deletion requests within <strong>30 days</strong>. Deletion is
        permanent and cannot be undone.
      </p>

      <p className="mt-10 text-[13px] text-slate-400">
        Concussion Education Australia Pty Ltd · ABN 74 688 155 508 · See also our{' '}
        <a href="/privacy" className="underline">privacy policy</a>.
      </p>
    </main>
  )
}
