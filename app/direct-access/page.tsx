import { redirect } from 'next/navigation'

export default function DirectAccessPage() {
  // Direct access disabled in production — access only via magic link
  redirect('/')
}
