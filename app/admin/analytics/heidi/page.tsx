import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { HeidiAnalyticsClient } from './HeidiAnalyticsClient'

export const metadata: Metadata = {
  title: 'Heidi pitch tracking — Admin',
  robots: 'noindex, nofollow',
}

export default async function HeidiAnalyticsPage() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')?.value
  if (!adminSession) {
    redirect('/admin/login?from=/admin/analytics/heidi')
  }
  return <HeidiAnalyticsClient />
}
