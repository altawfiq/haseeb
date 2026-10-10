# CLAUDE.md

Read `PROJECT_BRIEF.md` first — it holds the goal, page inventory and content rules.

## Rules
- **Content is frozen.** Never rewrite, shorten, "improve" or invent copy, metrics,
  testimonials or images. Only presentation (layout, type, color, 3D, motion) changes.
  When unsure whether something counts as content, keep it as-is and ask.
- **Preserve SEO markup**: titles, meta descriptions, canonicals, OG/Twitter tags,
  JSON-LD, heading levels, alt text, internal link targets and filenames.
- Source content lives in `Muhammad Haseeb Sheikh _ Organic Growth & Healthcare SEO.zip`.
  Don't modify or delete it; extract to a scratch/temp directory to read it.
- Do not build, deploy or publish the redesign until the owner explicitly asks.
- Accessibility and performance are requirements: honour `prefers-reduced-motion`,
  keep text real HTML (not canvas-only), keep pages crawlable without JS where possible.
- The owner uses Claude Code in the browser (no local terminal). Give instructions
  as clicks in the claude.ai UI, not shell commands for them to run.

## Design workflow
- Use the `frontend-design` skill (`.claude/skills/frontend-design/`) for all UI work.
- Three references, each with one job (details in `design/REFERENCE_DNA.md`, read it
  before any design or build work):
  - https://oryzo.ai/ — atmosphere, immersive presentation, motion and pacing.
  - https://www.buzzinteractive.co/ — services, selected work, credibility, enquiry flow.
  - https://fiasco.design/ — project storytelling: challenge → approach → resulting work.
- Follow the design system in `design/REFERENCE_DNA.md` §5 ("Evidence in the light") and
  the content mapping in §6. Change it only with the owner's agreement.
- Borrow principles only. Never import the references' branding, copy, claims, fonts,
  colours-as-brand, images, video or other assets. Their screenshots in
  `design/reference-screens/` are research material, not build assets.
- Reordering whole sections is a presentation change but needs the owner's approval
  first (home sections carry visible numbers). The proposed order is in REFERENCE_DNA §6.1.
- If better storytelling needs information the owner hasn't supplied, add it to the gaps
  list (REFERENCE_DNA §7) and ask; never fill the gap with invented content.
- Oryzo ignores `prefers-reduced-motion`; this site must not. Every pinned, scrubbed,
  blurred or 3D effect needs a static, fully readable fallback.

## Browser inspection (Playwright MCP)
- Configured in `.mcp.json` (server `playwright`), headless, using the pre-installed
  Chromium at `/opt/pw-browsers/chromium` and the session's `HTTPS_PROXY`.
  Never run `playwright install`.
- Screenshots/snapshots go to `.playwright-mcp/` (git-ignored). File paths passed to
  the tools must be inside the repo.
- Known issue (2026-10-10): the MCP server received `${HTTPS_PROXY}` unexpanded, so its
  browser failed with `ERR_PROXY_CONNECTION_FAILED`. Workaround: drive the same Playwright
  package (in the npx cache) from a Node script with
  `chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY } })`.
- External sites only load if the cloud environment's network policy allows the host.
  On 2026-10-10 oryzo.ai, buzzinteractive.co and fiasco.design loaded, but these asset
  hosts were denied (403): cdn.prod.website-files.com (all Buzz styling), cdnjs.cloudflare.com,
  unpkg.com, cdn.jsdelivr.net, use.typekit.net, vimeo.com, www.google.com. Report
  denied hosts to the owner; don't route around the policy. Local previews: serve files with
  `python3 -m http.server <port>` and open `http://localhost:<port>/`.

## Git
- Work on the branch the session assigns; commit and push there. No PRs unless asked.
