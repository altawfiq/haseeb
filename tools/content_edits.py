"""Owner-directed content edits. The ONLY changes allowed to page content.

Every rule here is either an explicit owner instruction or a correction supported by
source evidence (a dashboard screenshot, a certificate image, or the site's own pages).
The evidence for each is recorded in design/AUDIT_V4_CROSSCHECK.md.

Both tools/build_site.py and tools/verify_content.py apply apply_edits(), so the content
check proves that nothing else differs from the original export. Each rule must match the
exact number of times given (None = any number, including zero), or the build stops.

Groups
  A. Privacy (2026-10-10): no client names or logos; empty brand sections and brand
     counts removed (2026-10-11).
  B. Evidence: no calls/clicks presented as appointments or patients; corrections that the
     screenshots and certificates support; no pointers to case studies that do not exist;
     no stale permission statements.
  C. Conversion and contact (2026-10-11): "Book a call" in the Home hero; Contact page
     without a form; Diagnostic request by email (no form endpoint exists); duplicate
     adjacent CTAs, job-search pitches on client-service pages, empty future-case filters,
     floating duplicate CTA bars and illegible tool marks removed.
"""
import re

# ---------------------------------------------------------------------------
# Booking destination. No scheduling URL exists in the repo or the source export.
# When the owner provides one (e.g. a Calendly/Cal.com link), put it here and rebuild;
# every "Book a call" link on the site switches over.
BOOKING_URL = ""
CONTACT_EMAIL = "haseeb7665@gmail.com"  # verified: used throughout the source export
BOOKING_HREF = BOOKING_URL or "mailto:%s?subject=Book%%20a%%20call" % CONTACT_EMAIL
# ---------------------------------------------------------------------------

DIAG_MAILTO = ("mailto:%s?subject=Free%%20diagnostic%%20request&amp;body=Your%%20name%%3A%%20%%0A"
               "Website%%20URL%%3A%%20%%0AWhere%%20are%%20you%%20now%%3F%%20%%0A"
               "Your%%20biggest%%20growth%%20challenge%%3A%%20" % CONTACT_EMAIL)

# Before/after comparison that replaces the "cost of waiting" curve. The two bars are the
# clinic's real six-month click totals (Search Console screenshot assets/img-d5c35ad67c9b.jpg:
# 7.65k previous 6 months, 48.2k last 6 months). Zero baseline, same scale for both bars.
_H = lambda v: round(v * 4.4, 1)  # 50k -> 220 px
WAIT_CHART = (
    '<svg class="waitchart" viewBox="0 0 640 300" role="img" aria-label="Organic clicks for one clinic, '
    'from Search Console: 7,650 in the previous six months and 48,200 in the last six months">\n'
    '        <line class="wc-grid" x1="60" y1="140" x2="600" y2="140"/>\n'
    '        <text class="wc-ax" x="52" y="144" text-anchor="end">25k</text>\n'
    '        <line class="wc-grid" x1="60" y1="30" x2="600" y2="30"/>\n'
    '        <text class="wc-ax" x="52" y="34" text-anchor="end">50k</text>\n'
    '        <g class="wc-bar wc-before"><title>Previous 6 months: 7.65k organic clicks</title>'
    '<path d="M150,250 V%(b1)s q0,-4 4,-4 h112 q4,0 4,4 V250 Z"/></g>\n'
    '        <g class="wc-bar wc-after"><title>Last 6 months: 48.2k organic clicks</title>'
    '<path d="M370,250 V%(b2)s q0,-4 4,-4 h112 q4,0 4,4 V250 Z"/></g>\n'
    '        <line class="wc-base" x1="60" y1="250" x2="600" y2="250"/>\n'
    '        <text class="wc-val" x="210" y="%(t1)s" text-anchor="middle">7.65k</text>\n'
    '        <text class="wc-val wc-val-after" x="430" y="%(t2)s" text-anchor="middle">48.2k</text>\n'
    '        <text class="wc-ax" x="210" y="276" text-anchor="middle">Previous 6 months</text>\n'
    '        <text class="wc-ax" x="430" y="276" text-anchor="middle">Last 6 months</text>\n'
    '      </svg>'
) % {"b1": 250 - _H(7.65) + 4, "b2": 250 - _H(48.2) + 4, "t1": 250 - _H(7.65) - 12, "t2": 250 - _H(48.2) - 12}

DIAG_REQUEST = (
    '<div class="req">\n'
    '          <p class="req-l">Email me these and I will take it from there:</p>\n'
    '          <ol class="req-list"><li>Your name</li><li>Website URL</li>'
    '<li>Where are you now? <span class="opt">(optional)</span></li>'
    '<li>Your biggest growth challenge <span class="opt">(optional)</span></li></ol>\n'
    '          <a class="btn btn-primary form-submit" href="%s">Get my free diagnostic <span class="arr">&rarr;</span></a>\n'
    '          <p class="form-note">No card, no spam, no obligation. Your details only ever reach me.</p>\n'
    '        </div>' % DIAG_MAILTO)

BOOK_CHANNEL = (
    '<a href="%s" data-booking><span class="ic">&#9673;</span><span class="ct"><span class="ck">Book a call</span>'
    '<span class="cv">Email me to pick a time</span></span><span class="arr">&rarr;</span></a>\n        ' % BOOKING_HREF)

# (page or "*", old, new, expected count per page; None = any)
REPLACEMENTS = [
    # ---------------- A. privacy ----------------
    ("index.html", 'Documented result: Cure Allergy Clinic grew', 'Documented result: a multi-location specialty clinic grew', 1),
    ("*", '>Cure Allergy Clinic<', '>Multi-location specialty clinic<', None),
    ("*", '>Vitality Direct Primary Care<', '>Direct primary care practice<', None),
    ("*", '>Purposeful Healing DPC<', '>Second direct primary care practice<', None),
    ("*", '>Jersey Family Health<', '>Family practice<', None),
    ("*", 'for Cure Allergy Clinic', 'for a multi-location specialty clinic', None),
    ("*", 'for Vitality Direct Primary Care', 'for a direct primary care practice', None),
    ("*", 'for Purposeful Healing DPC', 'for a second direct primary care practice', None),
    ("*", 'for Jersey Family Health', 'for a family practice', None),

    # ---------------- B. evidence ----------------
    # stale permission statements (no client is named any more)
    ("cases.html", 'Named clients are shown with their permission; software clients are described by category. ', '', 1),
    ("cases.html", ', named with permission,', ',', 1),  # og:description
    ("index.html", 'Named brands are shown with permission; some are properties I worked on in-house.',
     'Some are properties I worked on in-house.', 2),  # FAQ + FAQPage JSON-LD
    # pointers to case studies that do not exist (no web-tools or wholesale case is published)
    ("index.html", "I've also grown restaurant-tech, hospitality-software, web-tools and wholesale sites; those results are on the case studies page.",
     "I've also grown restaurant-tech and hospitality-software sites; those results are on the case studies page.", 2),
    ("cases.html", ', and those cases are maturing.', '.', 1),
    # partners: the dashboard shows Search Console clicks, not visits
    ("partners.html", '<div class="l">Visits from Google search</div>', '<div class="l">Organic clicks from Google search</div>', 1),
    # DPC trend: the screenshot (assets/img-fd11b03150de.jpg) shows clicks falling over the
    # last two months toward the previous period's level, not flattening
    ("*", 'Most of the gain came in the first half of the window; the last two months flattened.',
     'Most of the gain came in the first half of the window; the last two months declined.', None),
    # Business Profile interactions are reported for the whole profile, not the map pack
    ("index.html", 'straight off the map pack', 'from the Business Profile', 1),
    # calls are not booked patients
    ("index.html", ' That is as close to a booked patient as analytics gets.', '', 1),
    ("case-healthcare-seo.html", ' For a clinic, this is as close to a booked patient as analytics gets.', '', 1),
    ("case-healthcare-seo.html", ' The closest thing to a booked patient.', '', 1),
    ("case-healthcare-seo.html", ' It feels slower. It is far faster at actually producing patients.', '', 1),
    # cost of waiting: the totals are not a month-by-month trend
    ("index.html", " The shape of the line between them is illustrative, and your own curve will differ.", '', 1),
    # certifications: Semrush certificate expired 18.06.2026 (assets/img-e9c221a7266d.jpg)
    ("about.html", ' GA4 and Semrush certified.', '', 1),  # meta description
    ("about.html", 'He is GA4 and Semrush certified, works daily in', 'He works daily in', 1),
    ("index.html", 'Semrush Academy &middot; ID 6c1c0d4ebc', 'Semrush Academy &middot; ID 6c1c0d4ebc &middot; expired Jun 2026', 1),
    ("about.html", 'Semrush Academy · ID 6c1c0d4ebc', 'Semrush Academy · ID 6c1c0d4ebc · expired Jun 2026', 1),
    # partners: promises that conflict with the stated base (GMT+5) and 2-business-day replies
    ("partners.html", ' I work across US, UK and Australian hours, with same-day replies for active partners.', '', 1),
    ("partners.html", 'Same-day replies for active partners, audits within 48 hours &middot; US / UK / AU hours',
     'Audits within 48 hours', 1),

    # ---------------- C. conversion and contact ----------------
    ("index.html", '<a href="diagnostic.html" class="btn btn-primary">Get my free diagnostic <span aria-hidden="true">&rarr;</span></a>\n      <a href="#proof" class="txtlink">See the proof first</a>',
     '<a href="diagnostic.html" class="btn btn-primary">Get my free diagnostic <span aria-hidden="true">&rarr;</span></a>\n'
     '      <a href="%s" class="btn btn-ghost" data-booking>Book a call</a>\n'
     '      <a href="#proof" class="txtlink">See the proof first</a>' % BOOKING_HREF, 1),
    ("contact.html", '<div class="chan">\n        ', '<div class="chan">\n        ' + BOOK_CHANNEL, 1),
    ("contact.html", '<a class="skip" href="#contactForm">Skip to the form</a>', '<a class="skip" href="#contact-top">Skip to content</a>', 1),
    ("diagnostic.html", '<a class="skip" href="#diagForm">Skip to the form</a>', '<a class="skip" href="#diagForm-wrap">Skip to content</a>', 1),
    # diagnostic copy that described the removed form
    ("diagnostic.html", 'The form takes about two minutes. ', '', 2),       # FAQ + FAQPage JSON-LD
    ("diagnostic.html", ' The form takes about two minutes.', '', 1),       # offer box
    ("diagnostic.html", ' Two minutes in the form above is all it takes.', '', 1),
    ("privacy.html", 'If you submit the diagnostic form or the contact form, the details you enter',
     'If you use the diagnostic or contact email links, the details you include', 1),
    # footer taglines: one version (the one used on 7 of 9 pages)
    ("case-healthcare-seo.html", 'Find &middot; Understand &middot; Trust &middot; Choose', 'Diagnose &middot; Fix &middot; Measure', 1),
    ("partners.html", '<p>Your brand &middot; My execution &middot; Your margin</p>', '<p>Diagnose &middot; Fix &middot; Measure</p>', 1),
]

# Elements removed whole: (page, regex for the opening tag, tag name, expected count)
REMOVE_ELEMENTS = [
    ("index.html", r'<section id="brands"', "section", 1),            # empty "ten brands" section
    ("about.html", r'<section class="section tight prose" id="brands"', "section", 1),
    ("index.html", r'<section id="meaning"', "section", 1),           # "They are appointments."
    ("case-healthcare-seo.html", r'<section class="section tight prose" id="meaning"', "section", 1),
    ("*", r'<div id="stickyCta"', "div", None),                         # floating duplicate CTA bar
    ("case-healthcare-seo.html", r'<a id="stickyCta"', "a", 1),       # second floating CTA link
    ("case-healthcare-seo.html", r'<div class="midcta" data-tilt>', "div", 1),  # duplicate adjacent CTA
    ("cases.html", r'<button class="cat-pill" role="tab" data-cat="ecom"', "button", 1),  # empty filters
    ("cases.html", r'<button class="cat-pill" role="tab" data-cat="pro"', "button", 1),
    ("cases.html", r'<div class="cat-empty" data-empty="ecom"', "div", 1),
    ("cases.html", r'<div class="cat-empty" data-empty="pro"', "div", 1),
    ("contact.html", r'<div class="form-card" id="contactForm-wrap"', "div", 1),  # no contact form
    ("contact.html", r'<div id="contactThanks"', "div", 1),
    ("diagnostic.html", r'<div id="diagThanks"', "div", 1),
    ("*", r'<p class="altpath">Hiring for a role\?', "p", None),         # job pitch on client pages
    ("case-healthcare-seo.html", r'<p class="altpath">Hiring or evaluating for a role\?', "p", 1),
]
# altpath: kept on about.html (the recruiter path stays in Home's audience choice and About)
KEEP_ALTPATH = {"about.html"}

# Elements replaced whole: (page, regex, tag, new html)
REPLACE_ELEMENTS = [
    ("index.html", r'<svg class="waitchart"', "svg", WAIT_CHART),
    ("diagnostic.html", r'<form id="diagForm"', "form", DIAG_REQUEST),
]

# Exact snippets removed (page, snippet or regex, expected count, is_regex)
REMOVE_SNIPPETS = [
    ("index.html", '  <a href="#meaning" data-s="meaning"><span>What it means</span></a>\n', 1, False),
    ("case-healthcare-seo.html", '      <li><a href="#meaning">What this actually meant for the clinic</a></li>\n', 1, False),
    ("case-healthcare-seo.html",
     '<li><strong>Conversion clarity.</strong> Making the call the obvious next step is what turned rankings into actual patients.</li>', 1, False),
    ("cases.html", '\n      <a href="diagnostic.html" class="btn btn-ghost">Request a diagnostic</a>', 1, False),
    ("method.html", '\n    <a href="diagnostic.html" class="btn btn-ghost">Request a diagnostic</a>', 1, False),
    ("method.html", '\n      <a href="diagnostic.html" class="btn btn-ghost">Request a diagnostic</a>', 1, False),
    ("index.html", r'<span class="stack-logo"><img [^>]*></span>', 12, True),  # illegible tool marks
    ("contact.html", r'(?s)<script>\s*\(function\(\)\{\s*var ENDPOINT.*?</script>\n?', 1, True),
    ("diagnostic.html", r'(?s)<script>\s*\(function\(\)\{\s*var ENDPOINT.*?</script>\n?', 1, True),
]

# Logo <img> tags inside dashboard card tags (alt "... logo"); removed on every page.
LOGO_IMG = re.compile(r'<img src="assets/img-[0-9a-f]+\.png" alt="[^"]+ logo"[^>]*>')

CLIENT_NAMES = ["Cure Allergy", "Vitality Direct", "Sina Medical", "Jersey Family", "Purposeful Healing",
                "Editpad", "PrePostSEO", "Menumiz", "Hospoware", "Mega Wholesaler"]


def _element_end(s, start, tag):
    depth = 0
    for m in re.compile(r"<(/?)%s\b[^>]*>" % tag, re.I).finditer(s, start):
        if m.group(0).endswith("/>"):
            continue
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return m.end()
    raise ValueError("unclosed <%s>" % tag)


def _span(html, m, tag):
    """Start/end of the element at match m, swallowing its indentation and newline."""
    line = html.rfind("\n", 0, m.start()) + 1
    start = line if html[line:m.start()].strip() == "" else m.start()
    end = _element_end(html, m.start(), tag)
    if start == line and html[end:end + 1] == "\n":
        end += 1
    return start, end


def _applies(where, page):
    return where == "*" or where == page


def apply_edits(page, html):
    for where, old, new, count in REPLACEMENTS:
        if not _applies(where, page):
            continue
        n = html.count(old)
        if count is not None and n != count:
            raise ValueError("%s: expected %d of %r, found %d" % (page, count, old[:70], n))
        html = html.replace(old, new)
    for where, rx, tag, new in REPLACE_ELEMENTS:
        if not _applies(where, page):
            continue
        m = re.search(rx, html)
        if not m:
            raise ValueError("%s: element %r not found" % (page, rx))
        end = _element_end(html, m.start(), tag)
        html = html[:m.start()] + new + html[end:]
    for where, rx, tag, count in REMOVE_ELEMENTS:
        if not _applies(where, page):
            continue
        if "altpath" in rx and page in KEEP_ALTPATH:
            continue
        found = 0
        while True:
            m = re.search(rx, html)
            if not m:
                break
            start, end = _span(html, m, tag)
            html = html[:start] + html[end:]
            found += 1
        if count is not None and found != count:
            raise ValueError("%s: expected %d element(s) %r, removed %d" % (page, count, rx, found))
    for where, snip, count, is_rx in REMOVE_SNIPPETS:
        if not _applies(where, page):
            continue
        if is_rx:
            html, n = re.subn(snip, "", html)
        else:
            n = html.count(snip)
            html = html.replace(snip, "")
        if n != count:
            raise ValueError("%s: expected %d of snippet %r, found %d" % (page, count, snip[:60], n))
    html = LOGO_IMG.sub("", html)
    return html


def leftover_names(html):
    """Client names still present anywhere in the page (text, attributes, JSON-LD)."""
    return [n for n in CLIENT_NAMES if n in html]
