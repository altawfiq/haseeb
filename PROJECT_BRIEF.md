# Project Brief — Portfolio Redesign

## Goal
Redesign Muhammad Haseeb Sheikh's existing SEO portfolio (live at https://muhammadhaseeb.co)
using the **visual style, 3D presentation and animation principles of https://oryzo.ai/**,
while preserving the portfolio's **exact content**.

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

## Design direction (to be researched from oryzo.ai before building)
- Visual style, typography, palette and spacing of oryzo.ai.
- 3D presentation (e.g. WebGL/Three.js scenes, depth, objects).
- Animation principles (scroll-driven motion, transitions, easing, pacing).
- Must still respect `prefers-reduced-motion`, stay accessible, fast and crawlable
  (content in HTML, not only in canvas/JS).

## Status
- [x] Project prepared (this brief, CLAUDE.md, frontend-design skill, Playwright MCP).
- [ ] Inspect oryzo.ai in the browser (blocked until the environment allows `oryzo.ai`).
- [ ] Write a design spec mapping oryzo.ai principles onto each portfolio page.
- [ ] Build the redesign. **Not started — do not build or publish until the owner asks.**
