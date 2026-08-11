import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { CONFIG } from '@/lib/config'

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-lg font-bold text-white mb-2">
              Concussion Education <span className="text-[#5b9aa6]">Australia</span>
            </div>
            <p className="text-sm leading-relaxed mb-3">
              Australia&apos;s most comprehensive concussion management training. AHPRA-aligned, evidence-based education for healthcare professionals.
            </p>
            <a
              href="https://concussion-education-australia.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#5b9aa6] transition-colors"
            >
              <Image src="/logo.png" alt="Concussion Education Australia" width={16} height={16} className="w-4 h-4 rounded-sm" />
              concussion-education-australia.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/courses" className="hover:text-white transition-colors">All Courses</Link></li>
              <li><Link href="/preview" className="hover:text-white transition-colors">Course Preview</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/scat-forms" className="hover:text-white transition-colors">SCAT6 / SCOAT6 Forms</Link></li>
              <li><Link href="/assessment" className="hover:text-white transition-colors">Free Knowledge Test</Link></li>
              <li><Link href="/scat-mastery" className="hover:text-white transition-colors">Free SCAT6 Mastery Course</Link></li>
              <li><Link href="/ready-to-train" className="hover:text-white transition-colors">Practical Day — City Status</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/publications" className="hover:text-white transition-colors">Research &amp; Publications</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:zac@concussion-education-australia.com" className="hover:text-white transition-colors">
                  zac@concussion-education-australia.com
                </a>
              </li>
              <li><Link href="/pricing#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              {/* /about/zac-lewis, not the Squarespace #facilitators anchor.
                  The portal HAS a full instructor page — Person schema, AHPRA
                  registration, the lot — and this was the only nav element
                  pointing at a bio anywhere on the site. It sent the reader OFF
                  the portal, in a new tab, at the exact moment they were
                  checking who teaches the thing they are about to pay for. The
                  internal page got 2 sessions in 90 days against 182 on
                  /pricing, which is what an orphaned page looks like. */}
              <li><Link href="/about/zac-lewis" className="hover:text-white transition-colors">Instructor</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Student Login</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Refund Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Concussion Education Australia. ABN 74 688 155 508. All rights reserved.
          </p>
          <p className="text-xs">
            For all AHPRA clinicians &middot; {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online
          </p>
        </div>
      </div>
    </footer>
  )
}
