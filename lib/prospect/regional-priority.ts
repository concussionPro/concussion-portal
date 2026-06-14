/**
 * Regional accessibility priority (Zac 2026-06-14).
 *
 * Zac is Byron Bay based — flies from Ballina (BNK) + Gold Coast (OOL) — and his
 * on-site course attendees are overwhelmingly REGIONAL (metro clinicians are
 * CPD-saturated and less interested; regional clinicians have less access and
 * value an on-site day where Zac comes to them). So large-clinic prospecting is
 * weighted toward clinics he can actually reach: DRIVE from Byron, or FLY from
 * OOL/BNK to a serviced regional airport — and AWAY from saturated capital-city
 * metros.
 *
 * Pure, dependency-free. Returns a 0-100 score (higher = prioritise) used to
 * sort the approval queue + send order.
 */

export type AccessTier =
  | 'drive'        // drivable from Byron Bay — no flight, cheapest on-site
  | 'fly-regional' // regional centre with flights from OOL/BNK
  | 'metro'        // capital-city metro — reachable but CPD-saturated
  | 'far'          // hard to reach from OOL/BNK / unknown

export interface RegionalPriority {
  tier: AccessTier
  /** 0-100 sort weight — drive > fly-regional > metro > far. */
  score: number
  /** Short why, for the admin UI. */
  label: string
}

// Drive radius from Byron Bay (~within 3-3.5h): SE-QLD + Northern Rivers / Mid-
// North-Coast NSW. Matched against city/suburb text.
const DRIVE = [
  // SE QLD
  'gold coast', 'southport', 'robina', 'burleigh', 'palm beach', 'coolangatta', 'nerang', 'varsity', 'ashmore', 'helensvale', 'tweed',
  'brisbane', 'ipswich', 'logan', 'redland', 'cleveland', 'springfield', 'capalaba',
  'sunshine coast', 'maroochydore', 'caloundra', 'noosa', 'buderim', 'buddina', 'kawana', 'nambour',
  'toowoomba',
  // Northern Rivers / Mid North Coast NSW
  'byron', 'ballina', 'lismore', 'casino', 'murwillumbah', 'tweed heads', 'kingscliff', 'alstonville', 'goonellabah',
  'grafton', 'coffs harbour', 'sawtell', 'woolgoolga',
]

// Regional centres with flights from OOL/BNK (or a quick hop). Worth a trip for
// a multi-clinician on-site day.
const FLY_REGIONAL = [
  'newcastle', 'maitland', 'cardiff', 'charlestown', 'hunter',  // NTL — direct OOL+BNK
  'cairns', 'townsville', 'launceston',                          // direct from OOL
  'port macquarie', 'coffs',                                     // regional NSW
]

// Capital-city metros + their well-known suburbs — reachable but CPD-saturated,
// deprioritise. (Brisbane is in DRIVE, intentionally not here.)
const METRO = [
  'sydney', 'parramatta', 'bondi', 'cronulla', 'hurstville', 'kogarah', 'glebe', 'burwood', 'cammeray',
  'castle hill', 'bankstown', 'chatswood', 'manly', 'newtown', 'randwick', 'north sydney', 'mosman', 'ryde',
  'liverpool', 'penrith', 'blacktown', 'hornsby', 'macquarie', 'willoughby',
  'melbourne', 'richmond', 'fitzroy', 'carlton', 'st kilda', 'brighton', 'bentleigh', 'canterbury', 'caulfield',
  'box hill', 'camberwell', 'footscray', 'prahran', 'south yarra', 'hawthorn',
  'adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'blackwood', 'beulah park', 'darlington',
  'perth', 'subiaco', 'applecross', 'fremantle', 'joondalup', 'hillarys', 'doubleview', 'nedlands', 'cottesloe',
  'canberra',
]

function matches(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

/**
 * Classify a clinic's accessibility from Byron Bay / OOL / BNK.
 * Pass the clinic city + state (region optional, blended into the text).
 */
export function regionalPriority(
  city: string | null | undefined,
  state: string | null | undefined,
  region?: string | null,
): RegionalPriority {
  const text = `${city ?? ''} ${region ?? ''}`.toLowerCase().trim()
  const st = (state ?? '').toUpperCase()

  if (text && matches(text, DRIVE)) {
    return { tier: 'drive', score: 100, label: 'Drive from Byron' }
  }
  if (text && matches(text, FLY_REGIONAL)) {
    return { tier: 'fly-regional', score: 80, label: 'Fly OOL/BNK — regional' }
  }
  if (text && matches(text, METRO)) {
    return { tier: 'metro', score: 25, label: 'Capital metro — CPD-saturated' }
  }
  // Unknown city: lean on state. Regional QLD/NSW (Zac's catchment) > others.
  if (!text || text.includes('unknown')) {
    if (st === 'QLD' || st === 'NSW') return { tier: 'far', score: 50, label: 'NSW/QLD — region unconfirmed' }
    return { tier: 'far', score: 35, label: 'Region unconfirmed' }
  }
  // Known city, not in any list → treat as regional-ish (the long tail of real
  // regional towns we haven't enumerated), better than a known saturated metro.
  if (st === 'QLD' || st === 'NSW') return { tier: 'fly-regional', score: 65, label: 'Regional NSW/QLD' }
  return { tier: 'far', score: 40, label: 'Other regional' }
}

/** SQL-friendly score expression note: classification is done in JS, not SQL,
 * because the city/suburb matching is fuzzy. Callers stamp the score onto rows. */
