/**
 * SOM seed list for the Concussion Care PARTNERSHIP arm (Tiers 1–2).
 * Hand-enumerated from docs/concussion-care-arm-prospect-list.md — named
 * sports academies + the named elite-school sport associations.
 *
 * Contact name/email/role are intentionally NULL — Zac fills them per
 * institution before any founder-led outreach. Nothing here is sent.
 */
import type { PartnerType } from './helpers'

export interface PartnerSeed {
  name: string
  type: PartnerType
  region: string
  association: string
  notes?: string
}

export const PARTNER_SEED: PartnerSeed[] = [
  // ── TIER 1 · National Institute Network (academies) ──────────────────
  { name: 'AIS', type: 'academy', region: 'National', association: 'NIN' },
  { name: 'NSWIS', type: 'academy', region: 'NSW', association: 'NIN' },
  { name: 'Victorian Institute of Sport', type: 'academy', region: 'VIC', association: 'NIN' },
  { name: 'Queensland Academy of Sport', type: 'academy', region: 'QLD', association: 'NIN' },
  { name: 'SA Institute of Sport', type: 'academy', region: 'SA', association: 'NIN' },
  { name: 'WA Institute of Sport', type: 'academy', region: 'WA', association: 'NIN' },
  { name: 'Tasmanian Institute of Sport', type: 'academy', region: 'TAS', association: 'NIN' },
  { name: 'NT Sports Academy', type: 'academy', region: 'NT', association: 'NIN' },
  { name: 'ACT Academy of Sport', type: 'academy', region: 'ACT', association: 'NIN' },

  // ── TIER 1 · NSW Regional Academies of Sport ─────────────────────────
  { name: 'Hunter Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS', notes: 'lead #1' },
  { name: 'Illawarra Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS' },
  { name: 'Western Region Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS' },
  { name: 'South Coast Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS' },
  { name: 'Northern Inland Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS' },
  { name: 'Central Coast Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS' },
  { name: 'North Coast Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS' },
  { name: 'Riverina Academy of Sport', type: 'academy', region: 'NSW', association: 'NSW RAS' },
  { name: 'Southern Sports Academy', type: 'academy', region: 'NSW', association: 'NSW RAS' },

  // ── TIER 2 · AAGPS NSW schools ───────────────────────────────────────
  { name: "The King's School", type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: 'Newington College', type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: 'Sydney Grammar School', type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: 'Sydney Boys High School', type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: "St Joseph's College Hunters Hill", type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: "St Ignatius' College Riverview", type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: 'Shore School', type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: 'The Scots College', type: 'school', region: 'NSW', association: 'AAGPS' },
  { name: 'The Armidale School', type: 'school', region: 'NSW', association: 'AAGPS' },

  // ── TIER 2 · CAS NSW schools ─────────────────────────────────────────
  { name: 'Barker College', type: 'school', region: 'NSW', association: 'CAS' },
  { name: 'Cranbrook School', type: 'school', region: 'NSW', association: 'CAS' },
  { name: 'Knox Grammar School', type: 'school', region: 'NSW', association: 'CAS' },
  { name: 'Trinity Grammar School', type: 'school', region: 'NSW', association: 'CAS' },
  { name: 'Waverley College', type: 'school', region: 'NSW', association: 'CAS' },
  { name: "St Aloysius' College", type: 'school', region: 'NSW', association: 'CAS' },

  // ── TIER 2 · GPS QLD schools ─────────────────────────────────────────
  { name: 'Anglican Church Grammar School', type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: "Brisbane Boys' College", type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: 'Brisbane Grammar School', type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: 'Brisbane State High School', type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: "St Joseph's College Gregory Terrace", type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: 'Ipswich Grammar School', type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: "St Joseph's Nudgee College", type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: 'Toowoomba Grammar School', type: 'school', region: 'QLD', association: 'GPS QLD' },
  { name: 'The Southport School', type: 'school', region: 'QLD', association: 'GPS QLD' },

  // ── TIER 2 · APS VIC schools ─────────────────────────────────────────
  { name: 'Brighton Grammar School', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Carey Baptist Grammar School', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Caulfield Grammar School', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'The Geelong College', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Geelong Grammar School', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Haileybury', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Melbourne Grammar School', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Scotch College', type: 'school', region: 'VIC', association: 'APS' },
  { name: "St Kevin's College", type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Wesley College', type: 'school', region: 'VIC', association: 'APS' },
  { name: 'Xavier College', type: 'school', region: 'VIC', association: 'APS' },
]
