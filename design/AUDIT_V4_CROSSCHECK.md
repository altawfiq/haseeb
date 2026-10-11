# Audit v4 cross-check

Date: 2026-10-11 · Branch: `claude/adoring-heisenberg-bjjc1t`

**Scope.** The Audit v4 document itself is not in the repository or this session (no file
was attached to the container). This cross-check covers every finding listed in the owner's
2026-10-11 brief that summarises Audit v4, plus the still-open items from the previous audit.
Each finding was checked against the **primary sources**, not the audit's summary:

- the original export, `Muhammad Haseeb Sheikh _ Organic Growth & Healthcare SEO.zip`;
- the dashboard screenshots and certificates inside it (`site/assets/img-*.jpg`, same files);
- the built pages in `site/` and the build scripts in `tools/`.

**Verdicts.** **Verified**: the source confirms the audit. **Contradicted**: the source
disagrees with the audit. **Needs verification**: the repo cannot settle it; owner input or
access is required.

**Where fixes live.** Every content change is a rule in `tools/content_edits.py` (applied by
the build and by `tools/verify_content.py`, which proves nothing else changed).

---

## 1. Privacy

| # | Finding | Verdict | Evidence | Action |
|---|---|---|---|---|
| 1.1 | Client names / logos must not be published | Verified (owner rule) | Names were in labels, alt text and Home JSON-LD; logos in the logo wall and dashboard card tags | Done 2026-10-10: names replaced by neutral descriptions; logo files not shipped; build fails if a name leaks |
| 1.2 | Empty "ten brands" sections remain after the logo wall was removed | Verified | `index.html#brands`, `about.html#brands` held only the heading "Work across ten healthcare, software and wholesale brands" and text | **Removed** both sections. The count "ten" is no longer supported by anything on the site |
| 1.3 | Stale permission statements | Verified | cases.html: "Named clients are shown with their permission…"; og:description "named with permission"; index FAQ + FAQPage JSON-LD: "Named brands are shown with permission" | **Removed** the stale clauses (FAQ keeps "Some are properties I worked on in-house.") |
| 1.4 | Anonymised dashboards still need permission | Needs verification | The source copy asserts permission for the published dashboards ("shared with permission", case study §01; "published with permission", Method §05). No separate permission record is in the repo | Left unchanged (owner rule: disputed permission is documented, not changed). **Owner to confirm** written permission for each published dashboard |
| 1.5 | Private dashboards must not be published | Verified (none published) | About says the 5x / 35% / 40%+ figures come "from private engagements whose dashboards are not published"; no such screenshot is in the export | No action |
| 1.6 | Patient information | Verified (none found) | All 19 screenshots reviewed: aggregate metrics only, account URLs cropped, no names | No action |
| 1.7 | Public repository exposes names | Verified | `altawfiq/haseeb` is public; names remain in the source zip, `tools/content_edits.py` and git history | **Owner action**: make the repo private and decide on a history rewrite |

## 2. Evidence and claims

| # | Finding | Verdict | Evidence | Action |
|---|---|---|---|---|
| 2.1 | "48.2k Visits from Google search" (Partners) | Verified | `img-d5c35ad67c9b.jpg` is Search Console "Total clicks 48.2k, Last 6 months" | **Corrected** to "Organic clicks from Google search" |
| 2.2 | "Cost of waiting" curve presents two six-month totals as a month-by-month trend | Verified | The SVG drew a curve from "Today" to "Month 6" between 7.65k and 48.2k plus a counterfactual "Without it" line; the caption admitted the shape was illustrative | **Replaced** with a before/after bar comparison of the two real totals (zero baseline, same scale, labelled, hover titles, accessible label). The "illustrative shape" sentence was removed. The Home 3D scene uses the same two totals as columns, not a curve |
| 2.3 | DPC trend wording ("the last two months flattened") | Contradicted in part | `img-fd11b03150de.jpg`: clicks run ~40-70/day to day ~100, then fall from ~55 to ~25-35/day over the last two months, converging with the previous-period line. "Most of the gain came in the first half" holds; "flattened" understates a decline | **Corrected** to "the last two months declined" (Home card + Cases). Purposeful DPC "steadier curve" (`img-b2038b80cff4.jpg`) is a fair reading; unchanged |
| 2.4 | Query-count claims ("ranking for a handful of queries to thousands", "a few dozen queries now ranks for thousands", "far more queries") | Needs verification | The screenshots are Performance overviews (clicks, impressions, CTR, position). None shows a query count | **Flagged, unchanged.** Owner to supply query-report evidence or approve removal |
| 2.5 | Business Profile source wording | Verified in part | 891 calls Jan-Mar 2026 +19.4% (`img-1e4ef3b287bf.jpg`, `img-398a6270cb34.jpg`); 802 interactions Feb-Jun 2026 +72.8% (`img-04744b340c74.jpg`, `img-712442ff0a7b.jpg`); 237 calls Dec 2025 +24.7% (`img-d0f43b684a89.jpg`); 51 calls Aug-Nov 2025 +8.5% (`img-dc5e755b58ce.jpg`). All match. "Straight off the map pack" is wrong: the screenshot reports "Business Profile interactions" for the whole profile | **Corrected** "straight off the map pack" to "from the Business Profile" |
| 2.6 | Date ranges | Verified, one gap | GSC 3-month view 15/12/2025-13/03/2026 (`img-c512a6606a0c.jpg`) matches. GA4 "January to June 2026": the screenshot shows "This year (Jan – Today)" with an axis to late June but **no year** (`img-285535b010dd.jpg`, `img-333eff4eb948.jpg`) | GA4 year **flagged**: owner to confirm 2026 |
| 2.7 | Calls described as appointments / patients | Verified (partly fixed earlier) | Removed 2026-10-10: two "They are appointments." sections, "actual patients". Remaining: "as close to a booked patient as analytics gets" ×2, "The closest thing to a booked patient", "far faster at actually producing patients" | **Removed** the remaining four sentences. Kept: general method language ("how patients search", "calls and bookings" as what is measured) |
| 2.8 | 6.3× claim | Verified | 48.2k ÷ 7.65k = 6.30 (`img-d5c35ad67c9b.jpg`) | No change |
| 2.9 | DPC figures (4.24k→8.37k clicks, 525k→1.6m impressions, 14.6→8.6 position) vs an older brief (4.04k, 736k, 6.7) | **Contradicted** (older brief) | `img-fd11b03150de.jpg` shows 4.24k / 8.37k, 525k / 1.6m, 14.6 / 8.6, CTR 0.8% / 0.5% | No change. The older brief's values are not supported by any file in the repo |
| 2.10 | Other dashboard figures | Verified | Every figure on Home, Cases, Method and the case study matches its screenshot or is derived correctly (e.g. ~464 = 802 ÷ 1.728; +38% = 3.58k ÷ 2.6k; 9x = 11.6k ÷ 1.29k; +117% = 278 ÷ 128) | No change |
| 2.11 | Pointers to case studies that do not exist | Verified | index FAQ (+JSON-LD): "web-tools and wholesale sites; those results are on the case studies page", but no web-tools or wholesale case is published. Cases intro: "those cases are maturing" (e-commerce, professional services) | **Corrected**: FAQ now lists only restaurant-tech and hospitality-software (both published); the "maturing" clause removed |
| 2.12 | Empty future-case filters | Verified | Cases filter had "Ecommerce · soon" and "Professional services · soon" with empty panels | **Removed** both pills and panels. Healthcare SEO 5 / SaaS 3 counts verified against the cards |
| 2.13 | Unverifiable experience claims | Needs verification | "~4 years" / "Nearly four years" (consistent with "since 2022" and the 2022- role dates; DigiSkills course Jun-Sep 2021); 5x booked calls, 35% in 90 days, 40%+ pages recovered (private, no dashboards); Rawah "acquired"; "Government College University, Faisalabad" (About JSON-LD); "link building for Australian agency clients for a year"; "white-label fulfilment for a US agency today" (Partners) | **Flagged, unchanged** (owner rule: disputed claims stay until resolved) |
| 2.14 | Work / intervention narratives | Needs verification | The repo holds results screenshots only. No project material (audits, page lists, tickets) substantiates what was done in each engagement | **Flagged.** The narratives are the owner's account; nothing was added or embellished |

## 3. Certifications

| # | Finding | Verdict | Evidence | Action |
|---|---|---|---|---|
| 3.1 | Semrush certificate expired 18 June 2026 | Verified | `img-e9c221a7266d.jpg`: "Certificate expires 18.06.2026" | **Corrected**: cards show "· expired Jun 2026"; removed "GA4 and Semrush certified" from About meta description and summary (present tense) |
| 3.2 | GA4 certificate expires 21 October 2026 | Verified | `img-3f494f6cc52c.jpg`: issued 21 Oct 2025, expiry 21 Oct 2026 | About keeps "valid to Oct 2026" (true today). **After 21 Oct 2026 it lapses**: owner to renew or have it marked expired |
| 3.3 | DigiSkills, LinkedIn Learning | Verified | DigiSkills issued 08/09/2021, ID BXUY5PBPQ; LinkedIn Learning completed 21 Jun 2025 | No change |
| 3.4 | Credentials in About JSON-LD | Verified (no validity claim) | `hasCredential` lists the four credentials without validity dates | No change |

## 4. Framework wording (Home, Method, Diagnostic, metadata, schema)

| # | Finding | Verdict | Evidence | Action |
|---|---|---|---|---|
| 4.1 | Constraint list varies | Verified: the source conflicts with itself | **3 layers** "demand, trust, and conversion": Diagnostic (hero answer, "What you get", FAQ + JSON-LD), About (summary, FAQ + JSON-LD), Method (hero lead, principle list, meta). **4 layers** "demand, technical access, trust and conversion": Home meta/JSON-LD, Home method step ("demand, trust, conversion, or a broken technical base"), Method "the four constraints named across this site" | **Not changed.** Competing versions listed here; the owner chooses one |
| 4.2 | Method sequence | Verified: the source conflicts with itself | Method summary: "technical baseline, then constraint diagnosis, then intent-mapped content, then execution, then measurement". Method phases on the same page: Diagnose, Prioritize, Architect, Execute, Measure and refine. Home: Diagnose, Fix in sequence, Measure | **Not changed.** Owner chooses |
| 4.3 | Footer taglines | Verified | "Diagnose · Fix · Measure" on 7 pages; "Find · Understand · Trust · Choose" (case study); "Your brand · My execution · Your margin" (Partners) | **Unified** to "Diagnose · Fix · Measure" |

## 5. Audience, CTAs and promises

| # | Finding | Verdict | Evidence | Action |
|---|---|---|---|---|
| 5.1 | Job-search pitch on client-service pages | Verified | "Hiring for a role? …" closing lines on Home, Cases, Method and the case study | **Removed** there. Kept in Home's audience choice ("You want to see how I work") and About. The Home FAQ "Are you open to full-time or contract roles?" stays |
| 5.2 | Duplicate adjacent CTAs | Verified | "Get my free diagnostic" + "Request a diagnostic" (same link) on Cases and Method ×2; two consecutive CTA panels in the case study; two floating CTA bars on the case study; floating bar on every page | **Removed** the duplicates and the floating bars (the header CTA is always reachable) |
| 5.3 | "Book a call" in the Home hero | Owner request | No booking URL exists in the repo or the export | **Added**; it opens an email ("Book a call" subject) to the existing address. Change `BOOKING_URL` in `tools/content_edits.py` once a scheduling link exists |
| 5.4 | Contact page form | Owner request | Form had no endpoint (`ENDPOINT = ""`) | **Replaced** with Book a call, Email, LinkedIn and the diagnostic, all using existing links |
| 5.5 | Diagnostic form | Verified: no endpoint | `ENDPOINT = ""`; the script only opened a pre-filled email | **Replaced** with an email request that lists the same details (name, website URL, stage, challenge). Copy that said "the form" was trimmed; Privacy now says "diagnostic or contact email links". **Endpoint needed** to restore a form |
| 5.6 | Partner promises | Verified in part | "I work across US, UK and Australian hours, with same-day replies for active partners" and "Same-day replies … US / UK / AU hours" conflict with the stated base (Pakistan, GMT+5) and the site-wide "Reply in 2 business days" | **Removed** those two promises. Kept but **flagged**: 48-hour audits, 7-day first deliverables, 50% upfront, weekly updates, report 3 days before the client call, "Late = discounted" (no terms defined), no lock-in, NDA |
| 5.7 | Illegible tool marks | Verified | Wordmark logos (Semrush 264x148, Ahrefs 400x113, …) squeezed into 24x24 boxes | **Removed** the marks; tool names stay |

## 6. Technical and launch checks

| # | Finding | Verdict | Evidence | Action |
|---|---|---|---|---|
| 6.1 | Titles, meta, canonicals, breadcrumbs | Verified consistent | 10 unique titles; canonicals and breadcrumb items are extensionless (`https://muhammadhaseeb.co/cases`); internal links use `cases.html` | No change. **Needs verification**: the live host must serve or redirect `/cases` ↔ `cases.html`. `muhammadhaseeb.co` is blocked from this environment (403), and the export has no host config, `robots.txt` or sitemap |
| 6.2 | 404 page loads icons from the live domain | Verified | `404.html` links `https://muhammadhaseeb.co/favicon.png` and `apple-touch-icon.png` | Unchanged (source markup); works once deployed |
| 6.3 | Image dimensions | Fixed earlier | All images with a `src` carry width/height | Done |
| 6.4 | Analytics | Verified: none installed | No analytics code in any page; Privacy says the site "may use privacy-respecting, cookieless analytics" | **Owner/launch task**: choose a tool and account; add its snippet; keep Privacy accurate |
| 6.5 | Social image | Verified | og/twitter image `https://muhammadhaseeb.co/share.jpg` (no client data) | No change |

## 7. Competing values (not resolved by the repo)

| Item | Value A (source) | Value B (source) | Status |
|---|---|---|---|
| DPC clicks/impressions/position | 4.24k→8.37k, 525k→1.6m, 14.6→8.6 (`img-fd11b03150de.jpg`, site copy) | 4.04k, 736k, 6.7 (an older brief, not in repo) | A kept: it matches the screenshot |
| Constraint framework | 3 layers (Diagnostic, About, Method lead) | 4 layers (Home meta, Method §03) | Owner decision |
| Method sequence | baseline → diagnosis → content → execution → measurement (Method summary) | Diagnose → Prioritize → Architect → Execute → Measure (Method phases) | Owner decision |
| Response time | "within two business days" (Home, Diagnostic, Contact) | "same-day replies for active partners" (Partners, removed) | Conflict removed |

## 8. Open questions for the owner

1. A real scheduling URL for "Book a call" (until then it opens an email).
2. A form endpoint, if the diagnostic should use a form again.
3. Written permission for each published dashboard (1.4) and the specialty detail ("allergy and immunology").
4. Evidence or approval for the flagged claims (2.4, 2.13, 2.14) and the GA4 year (2.6).
5. Which framework wording to standardise on (4.1, 4.2).
6. GA4 certificate renewal before 21 Oct 2026.
7. Host setup for extensionless URLs, `robots.txt`, sitemap and analytics (6.1, 6.4).
8. Repository visibility and git history (1.7).
