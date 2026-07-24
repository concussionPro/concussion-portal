import { redirect } from 'next/navigation'

// Founding-clinic funnel retired — tools are now included with CCM/CRM
// enrolment. Redirect to the course pricing so no dead links remain.
export default function Page() {
  redirect('/pricing')
}
