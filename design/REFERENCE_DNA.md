# Reference DNA — Oryzo · Buzz Interactive · Fiasco

Research for the redesign of Muhammad Haseeb Sheikh's portfolio. This file records what the
three references actually do, then proposes **one** design system for the portfolio and maps
it onto the existing, frozen content.

- Inspected: 2026-10-10, Playwright + the pre-installed Chromium, desktop 1440×900 and
  mobile (iPhone 13 profile, 390×844, touch). Stepped scrolling with two frames per step
  (≈200 ms and ≈1.3 s after each scroll) so motion could be read as before/after pairs.
- Evidence labels used below:
  - **Observed** — seen in the captured frames.
  - **From source** — read from the site's own HTML/CSS/inline scripts, not seen running
    (used where blocked assets stopped the effect from running).
  - **Blocked** — could not be inspected; see "Blocked domains and missing assets".
- Screenshots referenced here are in `design/reference-screens/` (downscaled JPEGs,
  research only — never use them, or any reference asset, in the build).

This stage is research only. Nothing here changes copy, metrics, links or SEO markup.

---

## 1. Blocked domains and missing assets

All three primary domains loaded. Several third-party hosts did not: the environment's
egress policy answered **403 to CONNECT** for them (proxy log, 2026-10-10).

| Host | Used by | What was lost |
|---|---|---|
| `cdn.prod.website-files.com` | Buzz | **Entire stylesheet**, all images, videos and Webflow interaction JS. Buzz rendered as unstyled HTML on desktop and mobile. |
| `cdnjs.cloudflare.com` | Buzz | GSAP 3.12.7, ScrollTrigger, TextPlugin, Matter.js |
| `unpkg.com` | Buzz, Oryzo | Buzz: Lenis 1.2.3, SplitType. Oryzo: Rive WASM runtime |
| `cdn.jsdelivr.net` | Oryzo | Rive fallback WASM (two sustainability animations did not play) |
| `use.typekit.net` | Oryzo, Fiasco | Oryzo display face `halyard-display-variable`; Fiasco body face `area-normal`. Text fell back to the browser default, so **type in the screenshots is not the real type** for those roles. |
| `vimeo.com` / `player.vimeo.com` | Oryzo, Fiasco | Embedded films. Fiasco's video tiles render as black rectangles. |
| `www.google.com` (reCAPTCHA) | Fiasco, Buzz | Fiasco threw `n.ready is not a function`, which left Lenis in a `lenis-stopped` state: desktop wheel scrolling did nothing until the class was removed. |
| `d3e54v103j8qbb.cloudfront.net`, `static.cloudflareinsights.com`, `connect.facebook.net`, `collectcdn.com`, `link.msgsndr.com` | Buzz, Oryzo | jQuery (Buzz), analytics and trackers — no visual impact. |

Also noted:
- The Playwright **MCP server** could not browse at all: `.mcp.json` passes
  `--proxy-server ${HTTPS_PROXY}` and the variable was not expanded at launch (the process
  received the literal string), so Chromium failed with `ERR_PROXY_CONNECTION_FAILED`.
  The inspection used the same Playwright package and Chromium from a script instead.
- Oryzo's two "wearable gallery" MP4s aborted mid-load (`ERR_ABORTED`) during fast scrolling.
- Oryzo's WebGL ran on software rendering (SwiftShader). Frame timing is slower than on a
  real GPU, so durations below are approximate.

**To get full fidelity on a re-run**, the owner can add `cdn.prod.website-files.com`,
`cdnjs.cloudflare.com`, `unpkg.com`, `cdn.jsdelivr.net`, `use.typekit.net`, `vimeo.com`,
`player.vimeo.com` and `www.google.com` to the environment's allowed domains (claude.ai →
this session's environment menu in the title bar → Edit → Network access).

---

## 2. Oryzo — https://oryzo.ai/

**Role in this project: primary atmosphere, immersive presentation, motion and pacing.**

### What it is
A single-page, scroll-driven "product film" for a fictional cork coaster, made by the studio
Lusion as a showcase. Astro site, custom WebGL canvases (`canvas`, `preloader-canvas`,
`features-curve-canvas`, `wearable-main-canvas`) plus Rive animations. No GSAP, Lenis or
Three.js globals; the scroll engine is custom. Page height: **56,732 px desktop, 42,364 px
mobile** — about 63 and 50 viewports. Sections: Intro, Features, Product (testimonies),
Contact.

### Typography
- **Display:** `halyard-display-variable` (Typekit, blocked here), weight 500.
  H1 123 px / line-height 0.9 / tracking −0.018 em on desktop; 100 px on mobile.
  H2 51 px and H3 34 px, **uppercase**, line-height 1.0.
- **Serif:** Literata (variable 200–900, self-hosted) for running text and labels.
- **Mono:** DM Mono 400 for technical captions ("THERMAL DIFFUSION MODEL (TDM)", "T = 0.1").
- Body is small: 13.5 px desktop, 12.5 px mobile. Text is deliberately quiet; the object is
  the headline.
- Type is sized from a `--screen-unit` variable, so the whole layout scales with viewport
  width rather than reflowing at many breakpoints.
- **Observed:** the brand wordmark "ORYZO" is huge in the hero, then collapses to a small
  top-left logo once scrolling begins.

### Colour (from the stylesheet tokens)
| Token | Hex | Use |
|---|---|---|
| `--color-black` | `#100904` | Default stage, warm brown-black |
| `--color-white` | `#FFEDD7` | Text, warm bone rather than white |
| `--color-brown` | `#382416` | Panels, buttons |
| `--color-grey-brown` | `#6C5F51` | Secondary surfaces |
| `--color-green` | `#445231` | Loader and cutting-mat green |
| `--color-orange` | `#DC5000` | Single hot accent, glow colour |
| `--color-green-lightest` | `#F6E0C6` | Light "sustainability" chapter |

Most of the colour on screen comes from **lit photography and 3D**, not flat fills: warm
directional light, a dark vignette, a brown-orange floor glow.

### Spacing and grid
- 16 columns desktop, 6 tablet, 4 mobile. Gutter-to-column ratio fixed at 24 : 90.
- Generous negative space: most viewports hold one object, one heading and one short
  paragraph, placed left and right of the object.

### Imagery
- One hero object (the coaster) is the protagonist of every chapter. It is rendered in 3D
  and re-staged: top-down on a cutting mat → floating and rotating in darkness → held in a
  hand → worn on clothing → under a mug → macro cork texture.
- Supporting photography is tactile and close (bark, cork grain, desk objects).
- Fine **technical drawing** overlays: dashed circles, Bézier handles, measurement grids,
  dashed frames around media.

### Motion — observed
1. **Preloader as construction drawing (≈0–2.5 s).** On a green field, an orange
   Bézier-handle outline of the object draws itself, then a translucent fill sweeps around
   the ring clockwise like a progress dial (frames at 300, 1200, 2500 ms). The loader *is*
   the product, not a spinner.
2. **Hero reveal (≈5 s).** Cut to a top-down photo of the coaster on a cutting mat with the
   huge wordmark. Supporting copy fades in from low opacity.
3. **Scroll-pinned 3D chapter.** Over roughly 8–10 viewports the coaster stays centred while
   the background darkens to near-black, and it **rotates through scroll**: face-on →
   tilted → edge-on → flipped to its underside. Copy blocks either side ("ISN'T JUST A
   COASTER." / "Oryzo isn't just a coaster…") fade in from ~20 % opacity and stay put while
   the object moves.
4. **Blur-to-sharp, letter-by-letter headline.** "Powered by AI" resolves from heavy blur,
   left to right, across about 3 scroll steps, while a hand rises from the bottom edge to
   hold the coaster.
5. **State change by light.** Mid-chapter, a soft multi-colour glow appears around the
   *edges of the viewport* and cycles hue for about 8 scroll steps, then fades. The page
   says "something changed" through atmosphere, not a new section.
6. **Typewriter body copy.** "AI fills in the gaps. We said high five. It heard six." types
   in and later types out.
7. **Chapter colour flips.** Dark stages switch to the cream `#F6E0C6` for the
   sustainability chapter, and back.
8. **Persistent scroll prompt.** "SCROLL TO CONTINUE" with a circled chevron stays bottom
   right through pinned chapters, so the reader knows the page is still moving.
9. **Navigation.** Active item has a dotted underline; other items are dimmed and brighten
   on hover in ~120 ms. Each nav label is split into duplicated letters (from source:
   `IInnttrroo`), the markup of a letter-roll hover. Mobile replaces the nav with a small
   "● MENU" pill.
10. **Anchor jumps glide.** Clicking "Features" scrolled from 0 to ≈19,975 px in about 2 s
    with a strong ease-out (sampled every 250 ms: 16,715 → 18,208 → 19,028 → 19,478 →
    19,725 → 19,860 → 19,934 → 19,975). Most of the distance is covered in the first
    quarter-second.
11. **Features as staged rooms.** The features chapter is a photographic desk scene; the
    coaster lifts off the cutting mat and floats, then the camera pushes into a macro cork
    texture and a tiled floor before "Grip-locked antislip technology".
12. **Light chapter with one giant word.** "sustainability" is set huge in a heavy sans and
    the stage fades from dark to a warm light grey/cream around it.
13. **Horizontal product track.** In "Product", tall image cards with big serif titles
    ("Runs on the edge", "Always On", "Runs on RTX 3090", "Drop-Tested", "Legacy Support")
    slide sideways as you scroll down; titles overlap card edges.
14. **Ending.** Pricing tiers (Oryzo / Pro / Pro Max), then a closing statement in large
    uppercase serif beside an email field and studio contact details.
15. **Reduced motion is ignored.** With `prefers-reduced-motion: reduce` emulated, the
    animated loader still ran and was still loading at 6.8 s.

Capture note: frames taken after programmatic jumps deep into the page (30,000 px and
beyond) appear under a dark veil — likely a transition overlay that only clears with
continuous scrolling. Read their colour as darker than the real page. The "Smart flip
encryption" interaction could not be tested (its input never became interactable in the
automated browser).

### Motion — from source / not observed
- Rive-powered sustainability counters (blocked runtime).
- Only one custom easing in CSS: `cubic-bezier(.3,0,.66,-.3)` on a 0.5 s transform; most
  UI transitions are 0.15–0.3 s `ease`.
- **No `prefers-reduced-motion` rules in the stylesheet.** The portfolio must not copy that.

### What to take, what to leave
- **Take:** one protagonist object per chapter; pinned chapters where the object holds the
  centre and copy changes around it; a loader that draws the subject; blur-to-sharp reveals
  for a single key line; light and colour as state change; a persistent "scroll to
  continue" cue; quiet type next to a loud object; technical-drawing overlays.
- **Leave:** 50–60 viewports of scroll (too long for a lead-generation site); tiny 12–13 px
  body text; uppercase headings everywhere; the coaster, cork, Lusion branding, joke
  testimonials and any asset; the absence of reduced-motion handling.

---

## 3. Buzz Interactive — https://www.buzzinteractive.co/

**Role in this project: services, selected work, credibility and enquiry flow.**

> Fidelity warning: the Webflow stylesheet, images, video and every animation library were
> blocked, so Buzz rendered as unstyled HTML. Layout and motion below come from the page
> structure, inline CSS and inline scripts (**from source**), plus interactions tested on
> the unstyled DOM. Colour and type are only partly known.

### Structure (home page, in order)
1. Preloader with a percentage counter (labelled in the markup as a fake loader) and a
   greeting line.
2. Hero: H1 "Leading Full-Service Digital Agency" with a rotating word ticker
   (Digital / Tech / Branding / Social Media / Web / Product Agency) and a hover-to-play
   showreel.
3. Client logo marquee (two rows).
4. **Selected Work:** five projects, each a name plus service tags
   (Website · UI/UX · Motion Graphics).
5. **Our Services:** sticky section; service categories as cards that stack while the
   section is pinned, each with a long sub-list.
6. **About us** with four stat counters ("lead gen spike within 3 months", "custom-built
   interfaces", "more website engagement", "of clients stick around").
7. Testimonial slider (quote, name, role, company).
8. **Let's Connect** form, then a footer listing three offices with address, phone and email.

### Enquiry flow (tested)
- `/contact` numbers every step: **01. What do you need** (pill checkboxes: Website, SEO,
  UI/UX, Mobile App, Web App, Others) → **02. Project budget** (three pill radios) →
  03 Company → 04 Name → 05 E-mail → 06 Phone → 07 Designation → 08 How did you hear about
  us → Project details → "Submit Request".
- Clicking a pill toggles a real checkbox (tested: `Seo` checked). Submitting empty shows
  native validation on 9 required fields.
- From source: pills fill from the bottom on hover (`::before` height 0 → 100 %, 250 ms),
  selected pills shrink to `scale(0.9)` and turn hot pink `#FF00A3`.
- Takeaway: numbered, chunked questions make a long form feel like a short sequence.
  Choices are tappable pills, not dropdowns.

### Portfolio index (tested)
- `/buzz-portfolio`: H1 "We're Moving Brands to Action", filter tabs (All, Branding, Social
  Media, Website, UI/UX Design, Product Strategy), cards of name + one-line description +
  two tags. The filter could not run (Finsweet/Webflow JS blocked).

### Typography and colour (partial)
- Montserrat 100–900 via Google Fonts (did load).
- From inline CSS: black/white base, hot pink `#FF00A3` for selection, active slider dots
  and checked form pills.

### Motion — from source (not observed)
- Lenis smooth scroll: `lerp 0.1`, `wheelMultiplier 0.5`.
- SplitType + GSAP ScrollTrigger text reveals, triggered at `top 80%`:
  - words slide up from 100 % with `expo.out`, 1.5 s, 0.3 s total stagger;
  - lines slide up with a −6° skew, `expo.out`, 1.5 s, 0.03 s stagger;
  - a scrubbed "line mask" that wipes off each word as the paragraph crosses the centre
    (reading-progress highlight).
- Hero video expands from a clipped box to full-bleed `100vh` while its track is scrolled.
- Matter.js physics: tag shapes drop and can be dragged in a canvas.
- Webflow IX2 entrance transforms (e.g. `translate3d(0, 60%, 0) scale(0.75)`).
- Nav links roll their text up on hover (two stacked copies, 0.3 s).
- Custom cursor (`cursor: none` on body). Note this hides the system cursor — an
  accessibility cost.
- The site does include a `prefers-reduced-motion` rule.

### What to take, what to leave
- **Take:** a clear order — proof first (work), then what you do (services), then why to
  trust it (numbers and voices), then one enquiry block; numbered, pill-based enquiry steps;
  sticky stacking for a short list of services; the scrubbed reading highlight for one key
  paragraph; contact details repeated in the footer.
- **Leave:** fake loaders; custom cursors; physics toys; long service catalogues;
  superlatives ("leading", "best") and unverified stats; hot pink; Montserrat; all copy,
  client names and assets.

---

## 4. Fiasco — https://fiasco.design/ and a case study

**Role in this project: project storytelling — challenge → approach → resulting work.**

Pages inspected: home, `/work/`, and the **Pigment** case study (`/work/pigment/`), desktop
and mobile. WordPress theme, Lenis smooth scrolling, Gravity Forms.

### Typography
- **Sans:** `area-normal` (Typekit, blocked; fallback seen in screenshots) for headlines and
  UI. Home H1 60 px, weight 400, line-height 1.1, tracking −0.02 em. Fluid sizes via
  `calc()` between a min and max viewport (e.g. mega 47 → 80 px).
- **Serif:** HAL Timezone (self-hosted, loaded) for the editorial voice: section intros
  (34 px), case titles in *italic*, captions and tags (12 px).
- Weight stays at 400; hierarchy comes from size and the sans/serif switch, not bold.

### Colour
| Token | Hex | Use |
|---|---|---|
| off-white | `#F8F9F3` | Page background (cool, slightly green) |
| black | `#1D1E19` | Text, video placeholders, footer |
| `rgb(233,234,226)` | `#E9EAE2` | Secondary surface |
| yellow | `#FFF714` | End-of-page CTA panel (home) |
| pink, blue `#84BDFF`, green `#03AC47`, orange | | Per-project CTA panels (Pigment ends on pink) |
| hero band | warm grey (≈ `#9FA09A`) | Behind the home statement |

### Spacing, shape and grid
- Block spacing scale: 32, 56, 64, 80, 104, 120, 160 px.
- Radii: 4 and 8 px on media and tags; 40 px on large panels; full pills on buttons.
- Panels end with a **rounded bottom edge** that overlaps the next section (CTA panel,
  the dark "What can a rebrand do…" interruption on `/work/`).
- Work grid is **asymmetric**: two columns with different image sizes and vertical offsets.

### Imagery
- The work itself is the imagery: identity applications in context (billboards, phones,
  lanyards, signage), shown large. Short looping films (Vimeo, blocked here).
- Each work card: image, *italic serif* project name, one-line description, small sector and
  discipline tags with icons.

### Case study pattern (Pigment)
1. **Header:** H1 is the client name (small, 20 px serif); H2 is the one-line outcome
   ("Launching a new era of Agentic AI for global business planning platform"). Right
   column lists **ten deliverables** as small tags and two sector tags.
2. **Context and challenge:** two short paragraphs on who the client is and why it matters,
   then a **"Read more"** link that expands the brief: scope, timeline ("in just two
   months") and "our challenge was to…".
3. **Chapters:** five H4 chapters ("The Creative Platform", "A Prism of Possibilities",
   "An Identity For Every Agent", "One Seamless Experience", "A Brand to Stand Apart").
   Each is one short paragraph followed by large media; the story alternates text → proof.
4. **Gallery interruption:** a horizontal carousel with arrow and dot controls.
5. **Credit / thanks** in centred serif, naming the client team.
6. **Closing CTA panel** with rounded bottom ("Looking to connect more deeply with your
   audience?" → "Get in touch").
7. **What's Next?** — two related projects.
8. Footer with a giant wordmark filling the width.

### Motion — observed
1. **Pinned horizontal gallery on vertical scroll (home).** The words "From concept" sit
   centre-left; project images, each slightly rotated (±3–8°), travel right-to-left across
   the pinned viewport over about 8 steps; then "to craft" appears and the gallery exits.
   The phrase is split across the gallery: the sentence is the scroll track.
2. **Floating "Book a chat" pill.** A dark pill with a team member's photo and a mail icon
   appears bottom-centre once the hero has passed and stays through the page. It hides
   behind the cookie banner on mobile.
3. **Sticky filter bar on `/work/`.** A dark pill (All, Technology, Climate, Education,
   Culture) floats bottom-centre while the grid scrolls.
4. **Panels sliding over panels.** Rounded-bottom panels (yellow CTA, dark promo) appear to
   ride over the next section.
5. Live clock "22:56 UK" in the header.
6. Hovering a work card produced **no visible change** in the captured frames (the hovered
   card's media was a blocked video). Treat card hover as unknown.

### Motion — from source
- Lenis smooth scroll.
- Easings: `cubic-bezier(0,0,0,1)` (expo-like out, 0.3–1 s on opacity),
  `cubic-bezier(.89,0,.15,1)` (strong in-out), `cubic-bezier(.3,-.43,0,1)` (anticipation),
  `cubic-bezier(.17,.67,0,1.02)` (slight overshoot).
- Includes a global `prefers-reduced-motion` reset and stops the logo ticker.

### What to take, what to leave
- **Take:** client name small, outcome large; deliverables listed beside the intro;
  challenge first with an optional "read more"; chaptered approach with text → proof
  rhythm; the floating CTA pill with a real face; a sticky filter on the case index;
  "what's next" at the end of each case; serif italic for names and captions; asymmetric
  grid; rounded-bottom panels.
- **Leave:** the bright per-project candy colours; the live clock; video-heavy media; all
  copy, names and assets.

---

## 5. One design system for the portfolio

Working name: **"Evidence in the light."** The site is a lit stage where real Search Console
evidence is the protagonist, the way Oryzo's coaster is. Every chapter puts one piece of
proof in the centre and lets the explanation move around it.

### 5.1 Principles

| # | Principle | Informed by |
|---|---|---|
| P1 | **One protagonist per chapter.** Each pinned chapter centres one real artefact: the 7.65k → 48.2k click curve, a dashboard screenshot, the 19 → 6.5 position move, Haseeb's photo. Copy changes around it. | Oryzo (coaster held centre while copy swaps) |
| P2 | **Proof before pitch.** Order each page: evidence → method → who it's for → enquiry. | Buzz (work → services → trust → form) |
| P3 | **Every case reads constraint → intervention → outcome → limit.** The site's own case cards already use these four labels; the layout makes them the spine. | Fiasco (challenge → chapters → result) |
| P4 | **Quiet type, lit evidence.** Type stays calm and readable; light, depth and motion are spent on the evidence. | Oryzo (small text, loud object) |
| P5 | **Motion explains change.** Movement shows a before becoming an after (a number, a position, a curve). No decorative entrances on every block. | Oryzo (rotation, blur-to-sharp, glow as state change) |
| P6 | **Honest numbers stay visible.** Metrics that got worse keep the same prominence as the ones that improved, in their own colour. | Portfolio's own copy ("Including the numbers that went the wrong way") |
| P7 | **One way to enquire, always in reach.** A single persistent pill leads to the diagnostic. | Fiasco ("Book a chat" pill), Buzz (single enquiry block) |

### 5.2 Colour

Two stages: a warm **night** stage for immersive chapters (Oryzo), and a cool **chart
paper** stage for reading evidence and case studies (Fiasco). Google dashboards are light
UI, so they read best on the light stage.

| Name | Hex | Role | Informed by |
|---|---|---|---|
| Night | `#15110C` | Immersive stage (hero, pinned chapters, footer) | Oryzo's warm stage; continuity with the current `--bg #0C0A08` |
| Bone | `#F1E8DA` | Text on Night | Oryzo's warm off-white text |
| Chart paper | `#EEF0E8` | Reading stage (evidence, cases, method, forms) | Fiasco's cool off-white |
| Graphite | `#22231E` | Text on Chart paper | Fiasco's `#1D1E19` |
| Signal amber | `#F2A33A` | The single accent: "after" values, primary button, focus ring on Night | Current site's `--amber #F5A623`, kept as brand continuity; Oryzo's one-hot-accent rule |
| Growth sage | `#3E9E78` | Data only: improved metrics (on Night) | Current `--sage`, toned down |
| Decline brick | `#C8553D` | Data only: metrics that got worse (on Night, large figures only) | Current `--brick`, toned down |
| Amber ink | `#875410` | Amber's role on Chart paper (text, links, "after" values) | Contrast fix for the light stage |
| Sage ink / Brick ink | `#2A6B50` / `#9E3D29` | Data colours on Chart paper | Contrast fix for the light stage |

Rules: amber is never decoration. Sage and brick are only for data, and a direction is
always also shown by an arrow or sign, never colour alone.

Measured WCAG contrast (normal text needs 4.5:1):

| Pair | Ratio | Verdict |
|---|---|---|
| Bone on Night | 15.5 | Pass |
| Graphite on Chart paper | 13.8 | Pass |
| Signal amber on Night (and Night text on an amber button) | 9.0 | Pass |
| Growth sage on Night | 5.7 | Pass |
| Decline brick on Night | 4.3 | Large text / graphics only |
| Signal amber on Chart paper | 1.8 | **Fail** → use Amber ink (5.5) |
| Growth sage on Chart paper | 2.9 | **Fail** → use Sage ink (5.5) |
| Decline brick on Chart paper | 3.8 | **Fail** → use Brick ink (5.8) |

### 5.3 Typography

| Role | Face | Settings | Informed by |
|---|---|---|---|
| Display and UI | **Schibsted Grotesk** (variable, Google Fonts, self-host) | H1 clamp(44px → 104px), weight 500, line-height 0.95, tracking −0.02 em. Sentence case — the existing headings are sentences and stay that way. | Oryzo's heavy display sans; Fiasco's large calm H1 |
| Editorial serif | **Newsreader** (variable, opsz, Google Fonts) | Body 18–20 px / 1.55 on desktop, 17 px mobile; *italic* for client names, captions and chapter labels | Oryzo's Literata; Fiasco's HAL Timezone italic names |
| Figures | Schibsted Grotesk with `font-variant-numeric: tabular-nums lining-nums` | Big numbers 64–160 px, weight 600 | Oryzo's oversized type, without a mono face |

- Body text is larger than in the references (they run 12–14 px); this audience reads
  details.
- No all-caps labels (the references use them; the existing content doesn't need them).
- Line length 60–72 characters.

### 5.4 Spacing, grid and shape

- 8 px base. Section rhythm: 32 / 56 / 80 / 120 / 160 px (Fiasco's block scale).
- Grid: 12 columns desktop, 6 tablet, 4 mobile; side gutter 16 px on phones, fluid
  margins elsewhere. Type and spacing scale with viewport width using `clamp()` (Oryzo's
  screen-unit idea, without locking everything to width).
- Pinned chapters use a three-zone layout: copy left (cols 1–4), protagonist centre (5–8),
  supporting copy or figure right (9–12). Mobile stacks: protagonist, then copy.
- Shape: 6 px radius on screenshots and tags; 32 px on large panels; full pills for buttons
  and the floating CTA. Panels that end a stage get a rounded bottom edge and overlap the
  next one (Fiasco).
- Technical-drawing layer: fine dashed rules, axis ticks and measurement brackets around
  evidence (Oryzo's drawing overlays, re-purposed as chart annotation).

### 5.5 Imagery

- **Only existing assets** — the dashboard screenshots, client logos, certificates, and
  `images/muhammad-haseeb-sheikh.jpg`. Re-framed, cropped, lit and placed in depth; never
  replaced or redrawn with different numbers.
- Dashboards sit in a "lightbox" frame: soft directional light, subtle depth, dashed
  annotation brackets pointing at the figure the caption quotes (P6).
- Client logos shown monochrome in Bone or Graphite as a credibility strip (Buzz marquee
  idea, but static).
- 3D (if used) shows **structure, not decoration**: e.g. a search-results column or the
  click curve as a lit physical form, driven by the real figures. No invented imagery.

### 5.6 Motion

| Pattern | Where | Spec | Informed by |
|---|---|---|---|
| Drawn loader → hero | Home first load only | The click line draws itself from 7.65k to 48.2k (≤1.2 s), then hands off to the hero. Never blocks content; skipped on repeat visits. | Oryzo construction-drawing preloader |
| Pinned evidence chapter | Home "The evidence"; case study | Protagonist holds centre for 2–3 viewports (not 10); copy changes either side; numbers count once. | Oryzo pinned rotation chapter |
| Blur-to-sharp line | One line per page, e.g. the H1 | 600–900 ms, left to right, `cubic-bezier(0,0,0,1)` | Oryzo "Powered by AI" |
| Light as state change | Moving from before → after values | Background light warms; amber edge glow fades in and out | Oryzo edge glow |
| Horizontal evidence track | Home "Six dashboards" | Pinned; cards travel right → left on vertical scroll, slight tilt that settles to 0° when in focus | Fiasco "From concept → to craft" |
| Reading highlight | One key paragraph (e.g. "The searches happen either way.") | Scrubbed mask clears word by word | Buzz `data-split-word` line mask |
| Floating CTA pill | All pages after the hero | Haseeb's photo + "Get my free diagnostic"; slides up 240 ms; hides over forms and the footer | Fiasco "Book a chat" |
| Scroll cue | Pinned chapters only | Small "scroll" prompt bottom right | Oryzo "Scroll to continue" |
| Nav hover | Header | Dim → full in 120 ms; active item dotted underline | Oryzo nav |

Global timing: UI 150–250 ms `ease-out`; reveals 600–900 ms `cubic-bezier(0,0,0,1)`;
pinned chapters scrubbed to scroll. Smooth-scroll library optional (both Fiasco and Buzz use
Lenis); native scroll must work without it.

**Reduced motion (required):** with `prefers-reduced-motion: reduce`, there is no loader,
pinning, blur, scrub, tilt or glow. Chapters render as static stacked sections with final
values shown, and the on-page "Motion: on" toggle stays available. Oryzo has no reduced-motion
handling; Fiasco and Buzz do — follow them.

**Crawlability:** every number, heading and caption stays in HTML. Canvas/WebGL only adds
presentation on top of content that is already readable without JS.

### 5.7 Interaction

- One primary action everywhere: **"Get my free diagnostic →"** (existing CTA text).
- Diagnostic and contact forms keep their exact fields
  (diagnostic: company, name, email, website, stage, message; contact: company, name,
  email, topic, website, message) but are presented as numbered steps. The optional `stage`
  and `topic` selects (four options each) can be shown as pill radios with the same names,
  values and labels (Buzz `/contact`).
- Case index gets a sticky filter pill using the **existing** categories
  ("Healthcare SEO 5", "SaaS 3", "Ecommerce soon", "Professional services soon") — Fiasco
  `/work/`.
- Case cards keep their existing "Read the case +" expanders (Fiasco "Read more").

---

## 6. Mapping to the existing content

Nothing below changes wording, numbers, links or heading levels. "Move" means changing the
order of whole sections; it needs the owner's approval because the home sections carry
visible numbers ("01 Start where you are" … "11 Before you ask").

### 6.1 Home (`index.html`)

| Existing section (exact heading) | Treatment | Reference |
|---|---|---|
| H1 "Your next customers are searching right now. I make sure they find you." with 7.65k → 48.2k | Night stage. Drawn-line loader becomes the hero's click curve; H1 resolves blur-to-sharp; the two figures sit either side of the curve. Primary CTA + "See the proof first". | Oryzo hero + loader |
| "Who is Muhammad Haseeb Sheikh?" answer block | Kept as real text directly under the hero, in serif, visually quiet (it's the AI/answer-engine summary). | — |
| 01 "What brings you here?" (two paths) | Two large split panels on Chart paper; each path's three bullets as a short list. | Buzz routing by need |
| 02 "Work across ten healthcare, software and wholesale brands." | Static monochrome logo strip with sector tags; the note about direct vs in-house work stays beneath. | Buzz logo marquee (static) |
| 03 "A clinic that was invisible. Six months later, page one." | **Signature pinned chapter.** Search Console screenshot centre; the three captions (Search Console, 891 calls, 58k users) step through one at a time; light warms from before to after. | Oryzo pinned chapter |
| 04 "Six dashboards. Including the numbers that went the wrong way." | Horizontal evidence track, one card per dashboard; each card shows its before → after rows with sage/brick by direction and the full explanatory paragraph. | Fiasco horizontal gallery |
| 05 "The searches happen either way." | Reading-highlight paragraph; the existing Today / Month 6 chart drawn as the two lines ("With the work" / "Without it"); illustrative note kept next to it. | Buzz line mask; Oryzo drawing |
| 06 "Those are not vanity metrics. They are appointments." | Night stage, one large figure (891 calls) with the illustrative caveat at the same visual weight as the claim. | Oryzo single-object stage |
| 07 "Growth has one binding constraint. I find it first." | The three steps (Diagnose / Fix / Measure — a true sequence, so numbering is justified); stack list as a quiet logo row. | Buzz sticky stacking services |
| 08 "Built on healthcare. Useful well beyond it." | Three audience panels. | — |
| 09 "I am Muhammad Haseeb Sheikh." | Portrait (existing photo) lit on Night; text in serif. | Oryzo lit-object treatment |
| 10 "Credentials you can verify." | Certificate cards with IDs in tabular figures. | Buzz credibility block |
| 11 "The questions people actually have." | Accordion (existing). | — |
| "Find out what is capping your growth." | Rounded-bottom Signal-amber CTA panel over the footer; footer with a giant "Haseeb" wordmark (existing logo text). | Fiasco CTA panel + footer |

**Suggested re-sequence (owner decision):** hero → 03 evidence → 04 dashboards → 06
appointments → 05 cost of waiting → 07 method → 02 brands → 08 who it's for → 01 what
brings you here → 09 who I am → 10 credentials → 11 FAQ → final CTA. This puts proof
before pitch (P2). If approved, the section numbers would either be renumbered or hidden;
both are content decisions for the owner. If not approved, the current order works with the
same treatments.

### 6.2 Case studies index (`cases.html`)
- Hero H1 "See what I did for businesses like yours." on Chart paper.
- Sticky filter pill with the existing category counts.
- Asymmetric two-column card grid (Fiasco). Each card: *italic serif* client name, H3
  outcome line, three big figures, sector tag. The existing **Constraint / Intervention /
  Outcome / Limit** expander becomes a four-part strip (P3); Limit keeps equal weight.
- The flagship (Cure Allergy Clinic) spans the full width, like Fiasco's lead project.
- "Ecommerce case studies are in progress" and "Professional services case studies are
  mid-flight" shown as honest placeholder cards, not hidden.

### 6.3 Flagship case (`case-healthcare-seo.html`) — Fiasco pattern
| Fiasco beat | Existing content that fills it |
|---|---|
| Client small, outcome large | H1 "How a specialty clinic went from page two to page one in six months." |
| Deliverables beside intro | The five phase titles act as the deliverables list (no new words). |
| Context / challenge | "A specialty clinic in a search-first category" → "What I found: invisible exactly where it counted" → "The five things I found holding it back" (five constraint cards). |
| Point of view | "Why I refused to 'just publish more content'". |
| Chapters (text → proof) | Phases 1–5, each one paragraph then its evidence; pinned Search Console chapter for "What changed, before and after". |
| Timeline | "How it unfolded, month by month" (four H4 beats) as a horizontal timeline. |
| Quote / thanks | "No cherry-picked quote here" — kept as written, in the centred serif slot Fiasco uses for its thank-you. |
| Result and limits | "What worked, and what to keep in mind" with "The honest limits" given equal weight. |
| Closing CTA panel | "Let me find what is capping your clinic's growth." |
| What's next | Links to `cases.html` (existing link). |

### 6.4 Other pages
- **Method (`method.html`):** the five phases are a real sequence → pinned stepper; the six
  layers as a diagram; "What I will not do." on Night for contrast.
- **About (`about.html`):** portrait chapter (Oryzo), credentials and numbers (Buzz).
- **Diagnostic (`diagnostic.html`) / Contact (`contact.html`):** numbered form steps and pill
  choices (Buzz); "Three steps, mostly on me" as a three-step strip; floating CTA hidden here.
- **Partners (`partners.html`):** three packages as stacked cards (Buzz services);
  "Send one client URL." as the closing CTA panel.
- **404 / Privacy:** Chart paper, typographic only, no motion.

---

## 7. Content gaps (information not supplied)

The redesign will not invent any of these. Each would strengthen the story if the owner
provides it:

1. **Client testimonials.** None exist; the case study says "No cherry-picked quote here"
   and that one will be added with permission. A real, permitted quote would fill the slot
   Fiasco uses for its client credit.
2. **Visuals of the work itself.** Apart from dashboards, there are no before/after page
   designs, site-structure maps or Business Profile screenshots per case. Fiasco's story
   relies on showing the made thing.
3. **Full write-ups for the other seven cases.** Only Cure Allergy Clinic has a long-form
   page; the rest have the four-part card only. Engagement length, start date and scope
   (what was delivered) per case would allow a Fiasco-style header for each.
4. **Deliverables list per case.** Fiasco lists 10 deliverables beside each intro; the
   portfolio has phase titles but no explicit deliverables.
5. **Permission status for named vs anonymised clients**, so logos and names can be shown
   consistently (cases page says named clients are shown with permission).
6. **Ecommerce and professional-services cases** — marked "in progress" / "mid-flight".
7. **Form destination.** `diagnostic.html` and `contact.html` both set `ENDPOINT = ""`. They
   still work: the script falls back to opening the visitor's email app with a pre-filled
   message (as the privacy page describes). A form endpoint would remove that extra step;
   it is the owner's choice. (Corrected 2026-10-10; the first version of this note said the
   forms could not submit.)
8. **Higher-resolution originals** of dashboard screenshots and the portrait, if available,
   for large lit presentation.

---

## 8. Screenshot index (`design/reference-screens/`)

Downscaled JPEGs (1200 px desktop, 390 px mobile). Research only; not for use in the build.

| File | Shows |
|---|---|
| `oryzo/01-loader-300ms.jpg`, `02-loader-2500ms.jpg` | Construction-drawing preloader filling like a dial |
| `oryzo/03-hero.jpg` | Hero: wordmark, cutting mat, quiet copy |
| `oryzo/04-pinned-rotate-a.jpg`, `05-pinned-rotate-b.jpg` | Pinned chapter: object rotating through scroll, copy fixed either side |
| `oryzo/06-blur-reveal.jpg` | "Powered by AI" resolving from blur, hand entering |
| `oryzo/07-edge-glow.jpg` | Viewport edge glow as a state change |
| `oryzo/08-features-desk.jpg` | Features: macro texture stage (dark veil — see capture note) |
| `oryzo/09-testimonies.jpg` | Testimonies stage (dark veil) |
| `oryzo/10-product-track.jpg` | Horizontal product track with big serif titles |
| `oryzo/11-contact.jpg` | Closing statement and contact |
| `oryzo/12-reduced-motion-still-loading.jpg` | Loader still animating with reduced motion emulated |
| `oryzo/mobile-s*.jpg` | Mobile sequence (MENU pill, pinned chapters, scroll cue, light chapter) |
| `oryzo/nav-hover.png` | Nav hover state |
| `fiasco/01-home-hero.jpg` | Home statement, cookie banner, video tile (blocked) |
| `fiasco/02-home-work-grid.jpg` | Asymmetric selected-work grid |
| `fiasco/03-track-from-concept.jpg` … `05-track-to-craft.jpg` | Pinned horizontal "From concept → to craft" gallery, floating "Book a chat" pill |
| `fiasco/06-cta-panel.jpg`, `07-footer-wordmark.jpg` | Rounded CTA panel; giant footer wordmark |
| `fiasco/work-01-grid-filter.jpg`, `work-02-promo-panel.jpg` | Work index: sticky filter pill; dark promo panel interrupting the grid |
| `fiasco/case-desktop-s*.jpg`, `case-mobile-s*.jpg` | Pigment case study, desktop and mobile (black tiles = blocked video) |
| `fiasco/home-mobile-s*.jpg` | Fiasco home on mobile |
| `buzz/*.jpg` | Unstyled renders (stylesheet blocked) — structure only |
