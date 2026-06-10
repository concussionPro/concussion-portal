import { describe, it, expect } from 'vitest'
import { extractTeam, findTeamPageLinks } from '@/app/api/admin/prospect-enrich-team-from-website/route'

describe('extractTeam', () => {
  it('counts JSON-LD Person blocks and excludes admin jobTitles', () => {
    const html = `<html><head>
      <script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[
        {"@type":"Organization","name":"Test Clinic"},
        {"@type":"Person","name":"Jane Doe","jobTitle":"Physiotherapist"},
        {"@type":"Person","name":"John Roe","jobTitle":"Senior Physiotherapist"},
        {"@type":"Person","name":"Mary Major","jobTitle":"Receptionist"}
      ]}
      </script></head><body><h1>Test Clinic</h1></body></html>`
    const result = extractTeam(html)
    expect(result).not.toBeNull()
    expect(result!.count).toBe(2)
    expect(result!.role).toBe('physiotherapists')
    expect(result!.names).toContain('jane doe')
    expect(result!.names).not.toContain('mary major')
  })

  it('counts heading names with clinical role lines nearby', () => {
    const html = `<html><body>
      <h2>Meet the Team</h2>
      <div><h3><span>Alice Wonder</span></h3><p>Osteopath</p></div>
      <div><h3><span>Bob Carlow</span></h3><p>Osteopath &amp; Director</p></div>
      <div><h3><span>Carol Danver</span></h3><p>Remedial Massage Therapist</p></div>
    </body></html>`
    const result = extractTeam(html)
    expect(result).not.toBeNull()
    expect(result!.count).toBe(3)
    expect(result!.role).toBe('osteopaths')
  })

  it('counts names inside staff-card CSS classes', () => {
    const html = `<html><body>
      <div class="team-member"><h4>Dana East</h4><p>Exercise Physiologist</p></div>
      <div class="team-member"><h4>Evan Frost</h4><p>Exercise Physiologist</p></div>
    </body></html>`
    const result = extractTeam(html)
    expect(result).not.toBeNull()
    expect(result!.count).toBe(2)
    expect(result!.role).toBe('exercisePhys')
  })

  it('excludes admin-only staff when titles are detectable', () => {
    const html = `<html><body>
      <h2>Our Team</h2>
      <h3>Fiona Gale</h3><p>Physiotherapist</p>
      <h3>Greg Holt</h3><p>Physiotherapist</p>
      <h3>Hanna Inez</h3><p>Practice Manager</p>
      <h3>Ivy Jonas</h3><p>Receptionist</p>
    </body></html>`
    const result = extractTeam(html)
    expect(result).not.toBeNull()
    expect(result!.count).toBe(2)
    expect(result!.names).not.toContain('hanna inez')
    expect(result!.names).not.toContain('ivy jonas')
  })

  it('counts practitioner profile links (nav-dropdown team listing)', () => {
    const html = `<html><body><nav><ul>
      <li><a href="https://clinic.example.com/therapist/kara-long/">Kara Long</a></li>
      <li><a href="https://clinic.example.com/therapist/liam-moss/">Liam Moss</a></li>
      <li><a href="https://clinic.example.com/therapist/nina-oates/">Nina Oates</a></li>
      <li><a href="https://clinic.example.com/services/">Services</a></li>
    </ul></nav></body></html>`
    const result = extractTeam(html)
    expect(result).not.toBeNull()
    expect(result!.count).toBe(3)
  })

  it('returns null for a page with no people', () => {
    const html = `<html><body>
      <h1>Welcome to Fit Gym</h1>
      <h2>State-of-the-Art Gym Facilities</h2>
      <h2>24/7 Access for Members</h2>
      <h2>Group Fitness Classes</h2>
      <p>Our physiotherapy services help you recover faster.</p>
      <h4>Phone</h4><h4>Email</h4>
    </body></html>`
    expect(extractTeam(html)).toBeNull()
  })

  it('rejects counts above the 150 sanity bound', () => {
    const first = ['Ada', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ida', 'Jay', 'Kai', 'Lea', 'Mia']
    const last = ['Quark', 'Reval', 'Stone', 'Truro', 'Umbra', 'Verne', 'Wilde', 'Xanth', 'Yarra', 'Zorne', 'Quill', 'Roone', 'Salte']
    const cards = first
      .flatMap((f) => last.map((l) => `<h3>${f} ${l}</h3><p>Physiotherapist</p>`))
      .join('\n')
    expect(extractTeam(`<html><body><h2>Our Team</h2>${cards}</body></html>`)).toBeNull()
  })

  it('does not let a role mention in an FAQ bleed into sponsor-club lists', () => {
    const filler = Array.from({ length: 20 }, (_, i) => `<p>Filler paragraph about appointments and billing number ${i}.</p>`).join('\n')
    const html = `<html><body>
      <p>Do I need a referral to see our sports physician?</p>
      ${filler}
      <h2>Sponsored Clubs</h2>
      <h4>Westside Wombats</h4>
      <h4>Eastside Eagles</h4>
    </body></html>`
    expect(extractTeam(html)).toBeNull()
  })
})

describe('findTeamPageLinks', () => {
  it('finds same-host team links outside the fixed candidate paths', () => {
    const html = `<html><body>
      <a href="/pages/our-team">Our Team</a>
      <a href="/about-us">About</a>
      <a href="https://other-site.example.com/team">External team</a>
      <a href="/contact">Contact</a>
    </body></html>`
    const links = findTeamPageLinks(html, 'https://clinic.example.com/')
    expect(links).toEqual(['https://clinic.example.com/pages/our-team'])
  })

  it('skips fixed candidate paths that the route already tries', () => {
    const html = `<a href="/our-team">Team</a><a href="/practitioners/">Practitioners</a>`
    expect(findTeamPageLinks(html, 'https://clinic.example.com/')).toEqual([])
  })
})
