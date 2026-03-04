import { redirect } from 'next/navigation'

export default function DevLoginPage() {
  // Development login disabled in production — access only via magic link
  redirect('/')
}
