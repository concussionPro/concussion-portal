import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DemoActivityClient } from './DemoActivityClient'

export const metadata: Metadata = {
  title: 'Demo Activity — Admin',
  robots: 'noindex, nofollow',
}

export default async function DemoActivityPage() {
  // Admin gate — must have admin_session cookie
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')?.value
  if (!adminSession) {
    redirect('/admin/login?from=/admin/demo-activity')
  }
  return <DemoActivityClient />
}
