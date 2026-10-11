# Project Brief — Portfolio Redesign

## Goal
Redesign Muhammad Haseeb Sheikh's existing SEO portfolio (live at https://muhammadhaseeb.co)
using principles from three references, while preserving the portfolio's **exact content**:

| Reference | Its job in this project |
|---|---|
| https://oryzo.ai/ | Primary visual atmosphere, immersive presentation, 3D, motion and pacing |
| https://www.buzzinteractive.co/ | Services, selected work, credibility and enquiry flow |
| https://fiasco.design/ | Project storytelling: connecting the challenge to the approach and the resulting work |

Storytelling improves only through **sequence, grouping, visual hierarchy and interaction**
— never through new or changed words.

## Source of truth for content
`Muhammad Haseeb Sheikh _ Organic Growth & Healthcare SEO.zip` (repo root) — a static
HTML export of the current site. Do not edit or delete the zip.

| File | Page |
|---|---|
| index.html | Home — "Your next customers are searching right now. I make sure they find you." |
| about.html | About Muhammad Haseeb Sheikh |
| cases.html | SEO case studies (index) |
| case-healthcare-seo.html | Healthcare SEO case study: page 2 → page 1 in 6 months |
| method.html | Constraint-First SEO Method |
| diagnostic.html | Free Organic Growth Diagnostic |
| partners.html | White-label SEO for agencies |
| contact.html | Contact |
| privacy.html | Privacy |
| 404.html | Not found |

Plus `assets/` (≈46 images), `images/muhammad-haseeb-sheikh.jpg`, `favicon.png`,
`apple-touch-icon.png`, `share.jpg`.

## What "preserve exact content" means
- Same pages, same URLs/filenames, same navigation targets.
- Same copy word-for-word: headings, body text, numbers/metrics, testimonials, CTAs, legal text.
- Same images (may be re-framed/re-styled, not replaced or dropped).
- Same SEO surface: `<title>`, meta description, canonical, Open Graph/Twitter tags,
  JSON-LD structured data, heading hierarchy, alt text, internal links.
- Forms keep the same fields and destinations.
- Only presentation changes: layout, typography, color, 3D, motion.

## Design direction
Full research, tokens and mapping: **`design/REFERENCE_DNA.md`**. Evidence and audit
status: **`design/AUDIT_V4_CROSSCHECK.md`**. Approved hybrid (2026-10-11):

- **Oryzo** (atmosphere, depth, motion, pacing): evidence scenes in WebGL. Home shows the
  clinic's two real six-month click totals (7.65k, 48.2k) as columns of light; the case
  study shows twenty result positions with a marker moving from #19 to #6.5. They animate
  on phones as well as desktop (scene-first hero below 1200px) and hold a deliberate still
  frame under reduced motion. All figures also live in the HTML.
- **Buzz** (services, selected work, credibility, enquiry): proof before pitch; one clear
  enquiry path ("Get my free diagnostic", plus "Book a call" in the Home hero); Contact
  offers Book a call, Email, LinkedIn and the diagnostic, with no form.
- **Fiasco** (case storytelling): the case study carries a stage bar (Challenge, Approach,
  Work, Results, Limits) that follows the reader; case cards keep Constraint, Intervention,
  Outcome, Limit.
- **Header**: concise labels, roomy spacing, collapses to an accessible menu before labels
  cramp; the motion toggle sits in the header; no floating bars over content.
- **Palette/type**: Night `#15110C` / Chart paper `#EEF0E8`, Signal amber `#F2A33A` with
  darker ink variants on the light stage; Schibsted Grotesk + Newsreader.
- **Privacy and evidence**: no client names, logos, brand counts or private dashboards;
  no calls or clicks presented as appointments; figures match their screenshots;
  unverifiable or disputed items are flagged, not rewritten.

### Decisions waiting on the owner
See `design/AUDIT_V4_CROSSCHECK.md` §8. In short:
- a scheduling URL for "Book a call" (set `BOOKING_URL` in `tools/content_edits.py`);
- a form endpoint, if the diagnostic should use a form again;
- written permission for each published dashboard; whether "allergy and immunology" is too
  identifying;
- evidence for flagged claims (query counts, ~4 years, 5x/35%/40%+, Rawah acquisition,
  university, Australian link building, US agency, work narratives) and the GA4 year;
- one framework wording (3 vs 4 constraint layers; Method sequence vs phases);
- GA4 certificate renewal before 21 Oct 2026 (Semrush already expired 18 Jun 2026);
- host setup: extensionless URLs vs `.html` links, robots.txt, sitemap, analytics;
- repository visibility (public) and git history containing client names.

## Status
- [x] Project prepared (this brief, CLAUDE.md, frontend-design skill, Playwright MCP).
- [x] Inspect oryzo.ai, buzzinteractive.co and fiasco.design (desktop + mobile, plus the
      Fiasco Pigment case study) — 2026-10-10. Buzz styling and some fonts/videos were
      blocked by the network policy; see REFERENCE_DNA §1.
- [x] Propose one design system and map it onto every page (`design/REFERENCE_DNA.md`).
- [x] Owner asked to implement (2026-10-10); home re-sequence applied (section numbers hidden on home).
- [x] Redesign implemented in `site/` (all 10 pages, same filenames/URLs). Generated by
      `tools/build_site.py` from the zip; content parity proven by `tools/verify_content.py`;
      browser checks by `tools/check_site.js` (screenshots in `design/implementation-screenshots/`).
- [x] Privacy and evidence edits applied (2026-10-10).
- [x] Audit v4 cross-check and hybrid pass (2026-10-11).
- [ ] Owner review of the implementation.
- [ ] Deploy. **Not done — do not deploy, merge or open a PR until the owner asks.**
