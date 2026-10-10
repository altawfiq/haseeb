"""Owner-directed content edits (2026-10-10). The ONLY changes allowed to page content.

1. Privacy: real client names and logos are not authorised for public use.
   * The logo wall is removed (home, about).
   * Logo images are removed wherever they appear (dashboard card tags).
   * Client names are replaced by neutral descriptions, built from wording the site
     already uses for those clients ("multi-location specialty clinic", "direct primary
     care practice", "family practice").
2. Evidence: clicks and calls are not presented as appointments without records.
   * The "Those are not vanity metrics. They are appointments." sections (home, case
     study) are removed, with the case study's contents-list entry and the home rail link.
   * One sentence claiming calls turned into "actual patients" is removed.

Both tools/build_site.py and tools/verify_content.py apply apply_edits(), so the content
check proves that nothing else differs from the original export. Every entry must match
exactly the number of times given, or the build stops (no silent drift).
"""
import re

# (page or "*", old, new, expected count per page where it applies)
REPLACEMENTS = [
    # specific sentences first, so the generic rules below do not pre-empt them
    # --- structured data (home JSON-LD) ---
    ("index.html", 'Documented result: Cure Allergy Clinic grew', 'Documented result: a multi-location specialty clinic grew', 1),
    # --- about: the sentence that listed four clients by name ---
    ("about.html",
     'Dashboards for Cure Allergy Clinic, Vitality Direct Primary Care, Purposeful Healing DPC and Jersey Family Health are on',
     'Dashboards for four healthcare clients are on', 1),
    # --- labels (start of a label/caption) ---
    ("*", '>Cure Allergy Clinic<', '>Multi-location specialty clinic<', None),
    ("*", '>Vitality Direct Primary Care<', '>Direct primary care practice<', None),
    ("*", '>Purposeful Healing DPC<', '>Second direct primary care practice<', None),
    ("*", '>Jersey Family Health<', '>Family practice<', None),
    # --- inside sentences and alt text ---
    ("*", 'for Cure Allergy Clinic', 'for a multi-location specialty clinic', None),
    ("*", 'for Vitality Direct Primary Care', 'for a direct primary care practice', None),
    ("*", 'for Purposeful Healing DPC', 'for a second direct primary care practice', None),
    ("*", 'for Jersey Family Health', 'for a family practice', None),
]

# Elements removed whole: (page, regex for the opening tag, tag name)
REMOVE_ELEMENTS = [
    ("index.html", r'<ul class="brandwall\b', "ul"),                 # logo wall
    ("about.html", r'<ul class="brandwall\b', "ul"),                 # logo wall
    ("index.html", r'<section id="meaning"', "section"),            # "They are appointments."
    ("case-healthcare-seo.html", r'<section class="section tight prose" id="meaning"', "section"),
]

# Exact snippets removed (page, snippet, expected count)
REMOVE_SNIPPETS = [
    ("index.html", '  <a href="#meaning" data-s="meaning"><span>What it means</span></a>\n', 1),
    ("case-healthcare-seo.html", '      <li><a href="#meaning">What this actually meant for the clinic</a></li>\n', 1),
    ("case-healthcare-seo.html",
     '<li><strong>Conversion clarity.</strong> Making the call the obvious next step is what turned rankings into actual patients.</li>', 1),
]

# Logo <img> tags inside dashboard card tags (alt "... logo"); removed on every page.
LOGO_IMG = re.compile(r'<img src="assets/img-[0-9a-f]+\.png" alt="[^"]+ logo"[^>]*>')

CLIENT_NAMES = ["Cure Allergy", "Vitality Direct", "Sina Medical", "Jersey Family", "Purposeful Healing",
                "Editpad", "PrePostSEO", "Menumiz", "Hospoware", "Mega Wholesaler"]


def _element_end(s, start, tag):
    depth = 0
    for m in re.compile(r"<(/?)%s\b[^>]*>" % tag, re.I).finditer(s, start):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return m.end()
    raise ValueError("unclosed <%s>" % tag)


def apply_edits(page, html):
    for where, old, new, count in REPLACEMENTS:
        if where not in ("*", page):
            continue
        n = html.count(old)
        if count is not None and n != count:
            raise ValueError("%s: expected %d of %r, found %d" % (page, count, old, n))
        html = html.replace(old, new)
    for where, rx, tag in REMOVE_ELEMENTS:
        if where != page:
            continue
        m = re.search(rx, html)
        if not m:
            raise ValueError("%s: element %r not found" % (page, rx))
        start = html.rfind("\n", 0, m.start()) + 1
        end = _element_end(html, m.start(), tag)
        if html[end:end + 1] == "\n":
            end += 1
        html = html[:start] + html[end:]
    for where, snip, count in REMOVE_SNIPPETS:
        if where != page:
            continue
        n = html.count(snip)
        if n != count:
            raise ValueError("%s: expected %d of snippet %r, found %d" % (page, count, snip[:60], n))
        html = html.replace(snip, "")
    html = LOGO_IMG.sub("", html)
    return html


def leftover_names(html):
    """Client names still present anywhere in the page (text, attributes, JSON-LD)."""
    return [n for n in CLIENT_NAMES if n in html]
