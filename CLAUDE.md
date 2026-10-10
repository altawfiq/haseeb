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
- Reference style: https://oryzo.ai/ — inspect it with the Playwright MCP before
  designing; capture screenshots of hero, scroll states, 3D elements and transitions.

## Browser inspection (Playwright MCP)
- Configured in `.mcp.json` (server `playwright`), headless, using the pre-installed
  Chromium at `/opt/pw-browsers/chromium` and the session's `HTTPS_PROXY`.
  Never run `playwright install`.
- Screenshots/snapshots go to `.playwright-mcp/` (git-ignored). File paths passed to
  the tools must be inside the repo.
- External sites only load if the cloud environment's network policy allows the host
  (`oryzo.ai` was blocked on 2026-10-10). Local previews: serve files with
  `python3 -m http.server <port>` and open `http://localhost:<port>/`.

## Git
- Work on the branch the session assigns; commit and push there. No PRs unless asked.
