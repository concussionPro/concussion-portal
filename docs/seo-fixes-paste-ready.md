# SEO + Email Fixes — paste-ready snippets

Generated from the 2026-05-08 audit of `concussion-education-australia.com`.
Each section says **where** to paste and **what to replace** so you can work
through this top-to-bottom in one sitting (~30 min total).

---

## 1. DNS — Cloudflare TXT records (5 min)

### 1a. Replace SPF record (root TXT)

**Current value (in DNS):**
```
v=spf1 include:_spf.google.com include:stmail.apollo.io ~all
```

**Replace with:**
```
v=spf1 include:_spf.google.com include:_spf.resend.com include:stmail.apollo.io ~all
```

Adds Resend so transactional + lifecycle emails align on SPF (DKIM already
aligns, so DMARC was passing — but strict providers like Microsoft weight
both). Lookup count goes 2 → 3, well under the 10-record SPF limit.

> **Verify Apollo:** check Apollo's current SPF docs. `stmail.apollo.io`
> didn't resolve when audited — if Apollo's now using `apollomail.com` or
> a different include, swap it. If you've stopped Apollo cold-email,
> remove the include entirely.

### 1b. Replace DMARC record (TXT on `_dmarc`)

**Current value:**
```
v=DMARC1; p=none; rua=mailto:dmarc@concussion-education-australia.com
```

**Replace with (phase 1 — relaxed quarantine at 25%):**
```
v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@concussion-education-australia.com; ruf=mailto:dmarc@concussion-education-australia.com; aspf=r; adkim=r; fo=1
```

Two-week phase plan:
- **Day 0** — apply the above. Watch `rua` aggregate reports daily.
- **Day 14** — if reports show 0 unauthorized fails, change `pct=25` →
  `pct=100`.
- **Day 30** — if still clean, change `p=quarantine` → `p=reject`.

Don't skip the phasing — Apollo cold-email volume can produce alignment
failures the first weeks while their relays warm up against the new SPF.

---

## 2. Squarespace — homepage Code Injection (10 min)

**Where:** Squarespace dashboard → Settings → Advanced → Code Injection →
Header. (Or per-page: home page → Page Settings → Advanced → Page Header
Code Injection.)

**Step 2a — find and DELETE these existing JSON-LD blocks** (audit found
them broken):
- The empty `LocalBusiness` block (no `name`, no `address`)
- The `LocalBusiness` block with `"image": "https://www.concussion-education-australia.com/path-to-your-logo.png"` (placeholder URL)
- The `Course` block referencing `wp-content/uploads/...` (stale WordPress
  URL on a Squarespace site — image 404s)

**Step 2b — paste these two blocks in their place:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Concussion Education Australia",
  "alternateName": "CEA",
  "url": "https://concussion-education-australia.com",
  "logo": "https://images.squarespace-cdn.com/content/v1/681be32e8c04e969c69c5971/244907ce-acbe-4894-b5a3-f93bbc4f460d/concussion-education-australia-logo.png",
  "description": "Australia's concussion CPD provider for GPs, physiotherapists, osteopaths and allied health clinicians. AHPRA-aligned, Osteopathy Australia endorsed.",
  "founder": {
    "@type": "Person",
    "name": "Zac Lewis",
    "jobTitle": "Founder & Lead Educator, Concussion Education Australia",
    "hasCredential": "Registered Osteopath (AHPRA), B.Clin.Sci., M.Ost.Med",
    "knowsAbout": [
      "Sport-Related Concussion",
      "SCAT-6 Assessment",
      "Vestibular-Ocular Screening",
      "Return-to-Play Protocols"
    ]
  },
  "address": { "@type": "PostalAddress", "addressCountry": "AU" },
  "areaServed": { "@type": "Country", "name": "Australia" },
  "inLanguage": "en-AU",
  "sameAs": [
    "https://portal.concussion-education-australia.com",
    "https://osteopathy.org.au"
  ],
  "memberOf": { "@type": "Organization", "name": "Osteopathy Australia" },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "zac@concussion-education-australia.com",
    "areaServed": "AU",
    "availableLanguage": ["en"]
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Concussion Clinical Mastery",
  "description": "Australia's evidence-based concussion CPD course for GPs, physiotherapists, osteopaths and allied health clinicians. SCAT-6, SCOAT-6, vestibular-ocular screening, return-to-play. 16 CPD hours, AHPRA aligned, Osteopathy Australia endorsed.",
  "inLanguage": "en-AU",
  "provider": {
    "@type": "EducationalOrganization",
    "name": "Concussion Education Australia",
    "url": "https://concussion-education-australia.com"
  },
  "hasCourseInstance": [
    {
      "@type": "CourseInstance",
      "courseMode": "online",
      "inLanguage": "en-AU",
      "offers": {
        "@type": "Offer",
        "price": "497.00",
        "priceCurrency": "AUD",
        "availability": "https://schema.org/InStock",
        "url": "https://concussion-education-australia.com/register-for-course"
      }
    },
    {
      "@type": "CourseInstance",
      "courseMode": "blended",
      "startDate": "2026-06-13T08:00:00+10:00",
      "endDate": "2026-06-13T17:00:00+10:00",
      "inLanguage": "en-AU",
      "location": {
        "@type": "Place",
        "name": "Rydges Melbourne",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "186 Exhibition St",
          "addressLocality": "Melbourne",
          "addressRegion": "VIC",
          "postalCode": "3000",
          "addressCountry": "AU"
        }
      },
      "offers": {
        "@type": "Offer",
        "price": "1190.00",
        "priceCurrency": "AUD",
        "availability": "https://schema.org/LimitedAvailability",
        "url": "https://concussion-education-australia.com/register-for-course",
        "validThrough": "2026-05-31T23:59:00+10:00"
      }
    }
  ],
  "educationalCredentialAwarded": {
    "@type": "EducationalOccupationalCredential",
    "name": "16 CPD Hours - AHPRA Aligned",
    "credentialCategory": "Continuing Professional Development",
    "recognizedBy": {
      "@type": "Organization",
      "name": "Australian Health Practitioner Regulation Agency",
      "alternateName": "AHPRA"
    }
  },
  "about": {
    "@type": "MedicalCondition",
    "name": "Sport-Related Concussion",
    "alternateName": ["Concussion", "Mild Traumatic Brain Injury", "mTBI"],
    "code": {
      "@type": "MedicalCode",
      "codeValue": "S06.0",
      "codingSystem": "ICD-10"
    }
  },
  "audience": {
    "@type": "EducationalAudience",
    "audienceType": "Healthcare Professionals",
    "educationalRole": [
      "Medical Doctor",
      "Physiotherapist",
      "Osteopath",
      "Sports Trainer",
      "Exercise Physiologist",
      "Nurse Practitioner"
    ]
  },
  "teaches": [
    "SCAT-6 Assessment Protocol",
    "SCOAT-6 Office Assessment",
    "Return-to-Play Decision Making",
    "Concussion Red Flags Recognition",
    "Vestibular-Ocular Motor Screening",
    "Neurocognitive Testing",
    "Return-to-Learn Protocol",
    "Return-to-Work Protocol"
  ],
  "timeRequired": "PT14H",
  "isAccessibleForFree": false
}
</script>
```

**Validate after pasting:** https://search.google.com/test/rich-results — paste
the live homepage URL. Should show 0 errors and detect both blocks.

---

## 3. Squarespace — homepage SEO settings (3 min)

**Where:** home page → Page Settings → SEO tab.

### 3a. Page title

**Replace:**
```
Concussion Training Australia | AOA Endorsed CPD Course for Clinicians
```

**With:**
```
Concussion Education Australia | OA-Endorsed CPD Course (16 CPD Hours)
```

(Drops the misleading "AOA" — that was the pre-2019 name. Uses the actual
brand. 67 chars.)

### 3b. Meta description

**Replace:**
```
[the meta description live on the Squarespace site at the time of the 2026-05-08 audit. Two false claims in one line: a CPD figure two re-rates stale, and an instructor credential CEA has never held — the founder is an AHPRA-registered osteopath, not a GP and not a PhD. Reproduced only as the string to search for; do not paste it anywhere.]
```

**With:**
```
AHPRA-aligned concussion CPD for Australian clinicians. 16 hours, hybrid (online + in-person practical). Endorsed by Osteopathy Australia. Register now.
```

(155 chars. Drops vague "GP & neuroscience PhD" framing — instructor names
go in the page body, not the snippet.)

---

## 4. Squarespace — fix the broken blog post (5 min)

**Where:** `/blog-1/2026-concussion-update-why-wait-until-symptom-free-is-officially-obsolete` → blog post editor.

### 4a. Delete the duplicate H1

The post currently renders **two H1 tags**:
- "2026 Concussion Update: Why 'Wait Until Symptom Free' is Officially Obsolete"
- "2026 Concussion Update: Why 'Wait and See' is Officially Obsolete"

Keep only the first one ("Symptom Free" — more keyword-relevant). Delete the
second. Likely caused by the Squarespace post title field plus a text-block
heading that got upgraded to H1.

### 4b. Add a unique meta description

Currently uses the generic site-wide description. Replace it (Page Settings
→ SEO) with something like:

```
Two years post-Amsterdam Consensus, "wait until symptom free" is obsolete. Why active recovery, vestibular-ocular screening, and SCOAT6 changed concussion management — and what AHPRA-registered clinicians need to update by 2026.
```

### 4c. Add Article schema as Code Injection (per-post)

Page Settings → Advanced → Page Header Code Injection:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "2026 Concussion Update: Why \"Wait Until Symptom Free\" is Officially Obsolete",
  "description": "Why active recovery, vestibular-ocular screening, and SCOAT6 changed concussion management — and what AHPRA-registered clinicians need to update by 2026.",
  "datePublished": "2026-01-04",
  "dateModified": "2026-01-04",
  "inLanguage": "en-AU",
  "author": {
    "@type": "Person",
    "name": "Zac Lewis",
    "jobTitle": "Founder & Lead Educator, Concussion Education Australia",
    "hasCredential": "Registered Osteopath (AHPRA), B.Clin.Sci., M.Ost.Med"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Concussion Education Australia",
    "url": "https://concussion-education-australia.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://images.squarespace-cdn.com/content/v1/681be32e8c04e969c69c5971/244907ce-acbe-4894-b5a3-f93bbc4f460d/concussion-education-australia-logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://concussion-education-australia.com/blog-1/2026-concussion-update-why-wait-until-symptom-free-is-officially-obsolete"
  },
  "about": {
    "@type": "MedicalCondition",
    "name": "Sport-Related Concussion",
    "code": {
      "@type": "MedicalCode",
      "codeValue": "S06.0",
      "codingSystem": "ICD-10"
    }
  },
  "citation": [
    {
      "@type": "CreativeWork",
      "name": "Consensus statement on concussion in sport (Amsterdam, 2023)",
      "url": "https://bjsm.bmj.com/content/57/11/695"
    },
    {
      "@type": "CreativeWork",
      "name": "AIS Concussion and Brain Health Position Statement",
      "url": "https://www.ais.gov.au/concussion"
    }
  ]
}
</script>
```

Repeat the pattern (changing `headline`, `description`, `datePublished`,
`dateModified`, `mainEntityOfPage.@id`) for the other 3 blog posts in the
sitemap. Citation URLs should match what the post actually cites.

---

## 5. Squarespace — fix `/scat-6-digital-tools` (3 min)

### 5a. Add a real H1

The page currently renders no H1. In the Squarespace page editor, add a
text block at the top of the content area, set it to **Heading 1**:

```
Free SCAT6 Concussion Assessment Form — Fillable PDF + Clinician's Guide (2026)
```

### 5b. Fix duplicate brand in title

Page Settings → SEO. Current title:
```
SCAT6 Fillable Form (Free PDF) + Clinician's Guide – Concussion Education Australia — Concussion Education Australia
```

Replace with:
```
Free SCAT6 Form (PDF) + Clinician's Guide | Concussion Education Australia
```

(Squarespace appends the site name automatically — don't include it in
the page title or you get the duplicate.)

### 5c. Verify lead capture

curl found no `<form>` on the page — likely a JS-rendered Squarespace
form block, but check in a real browser:

1. Open `/scat-6-digital-tools` in Chrome incognito.
2. DevTools → Network tab → filter `submit` or `form`.
3. Try submitting an email. If it doesn't post anywhere or there's no
   email field at all, the lead magnet is currently delivering downloads
   without capturing emails — restore the email gate before the next
   marketing campaign.

---

## 6. After everything's pasted (5 min total verification)

| What | How | Pass criteria |
|---|---|---|
| SPF | `dig +short TXT concussion-education-australia.com` | Includes `_spf.resend.com` |
| DMARC | `dig +short TXT _dmarc.concussion-education-australia.com` | Shows `p=quarantine; pct=25` |
| Homepage schema | https://search.google.com/test/rich-results | Course + Organization detected, 0 errors |
| Blog post schema | Same tool, blog URL | BlogPosting detected with author + citations |
| Title tag | View source, look for `<title>` | Contains "Concussion Education Australia", not "AOA" |

---

## 7. Order of operations

Do them in this order so each catches issues early:

1. **DNS records** (10 min wait for propagation) — start here, do other work while propagation happens
2. **Squarespace homepage Code Injection** + SEO settings
3. **Blog post H1 fix + Article schema** (4 posts to repeat for)
4. **SCAT6 page H1 + title + form check**
5. **Run all 5 verification checks above**

Total: ~30-45 min if blog posts are batched.

---

## What's already shipped in code

The portal-side schema helpers (`lib/schema-markup.ts`) are now AI-search
ready, with 35 tests covering correctness. So new pages added to the
portal pick up correct schema by default. The above is just for the
Squarespace marketing site, which can't be fixed from code.
