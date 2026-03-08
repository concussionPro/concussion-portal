'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from './SiteFooter'

const PUBLIC_ROUTES = [
  '/',
  '/preview',
  '/pricing',
  '/in-person',
  '/assessment',
  '/scat-forms',
  '/scat-mastery',
  '/resources',
  '/trial',
  '/preseason',
  '/scat6-download',
  '/blog',
  '/faq',
  '/courses',
  '/course',
  '/checkout',
]

export function FooterWrapper() {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )
  if (!isPublic) return null
  return <SiteFooter />
}
