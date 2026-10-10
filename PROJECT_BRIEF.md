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
Full research, tokens and page-by-page mapping: **`design/REFERENCE_DNA.md`**.
Summary of the proposed system, "Evidence in the light":

- **One protagonist per chapter** (Oryzo): real evidence — the 7.65k → 48.2k click curve,
  dashboard screenshots, the 19 → 6.5 position move, the portrait — held centre in pinned
  chapters while copy changes around it.
- **Proof before pitch** (Buzz): evidence → method → audience → one enquiry path.
- **Constraint → intervention → outcome → limit** (Fiasco): the case cards' existing four
  labels become the spine of every case; the flagship case follows Fiasco's
  intro → challenge → chapters → result → next pattern.
- **Two stages**: warm Night `#15110C` for immersive chapters, cool Chart paper `#EEF0E8`
  for reading evidence; Signal amber `#F2A33A` (continuity with the current amber) as the
  only accent (darker "ink" variants on the light stage for contrast); sage/brick reserved
  for metrics that rose/fell.
- **Type**: Schibsted Grotesk (display/UI, tabular figures) + Newsreader (editorial serif,
  italics for names and captions). Sentence case, larger body text than the references.
- **Motion explains change**: drawn-line loader, pinned evidence chapter, one blur-to-sharp
  line, horizontal dashboard track, scrubbed reading highlight, floating
  "Get my free diagnostic" pill with Haseeb's photo. Static, fully readable fallback under
  `prefers-reduced-motion`; all text stays HTML.
- Never import the references' branding, copy, claims, fonts, images or other assets.

### Decisions waiting on the owner
- Approve or reject the home-page re-sequence (REFERENCE_DNA §6.1); if approved, decide
  whether section numbers are renumbered or hidden.
- Supply any of the content gaps in REFERENCE_DNA §7 (testimonial, work visuals, case
  details, form destination — both forms currently have `ENDPOINT = ""`).
- Optionally allow the blocked asset hosts so Buzz and Fiasco can be re-inspected at full
  fidelity (REFERENCE_DNA §1).

## Status
- [x] Project prepared (this brief, CLAUDE.md, frontend-design skill, Playwright MCP).
- [x] Inspect oryzo.ai, buzzinteractive.co and fiasco.design (desktop + mobile, plus the
      Fiasco Pigment case study) — 2026-10-10. Buzz styling and some fonts/videos were
      blocked by the network policy; see REFERENCE_DNA §1.
- [x] Propose one design system and map it onto every page (`design/REFERENCE_DNA.md`).
- [ ] Owner review of the design system, re-sequence proposal and content gaps.
- [ ] Build the redesign. **Not started — do not build or publish until the owner asks.**
