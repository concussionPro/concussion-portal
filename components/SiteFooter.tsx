import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-lg font-bold text-white mb-2">
              Concussion<span className="text-[#5b9aa6]">Pro</span>
            </div>
            <p className="text-sm leading-relaxed">
              Australia&apos;s most comprehensive concussion management training. AHPRA-aligned, evidence-based education for healthcare professionals.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/preview" className="hover:text-white transition-colors">Course Preview</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/scat-forms" className="hover:text-white transition-colors">SCAT6 / SCOAT6 Forms</Link></li>
              <li><Link href="/assessment" className="hover:text-white transition-colors">Free Knowledge Test</Link></li>
              <li><Link href="/scat-mastery" className="hover:text-white transition-colors">Free SCAT Mastery Course</Link></li>
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
              <li><Link href="/faq/scat-assessment" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Student Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Concussion Education Australia. All rights reserved.
          </p>
          <p className="text-xs">
            Endorsed by Osteopathy Australia &middot; 14 AHPRA CPD Points
          </p>
        </div>
      </div>
    </footer>
  )
}
