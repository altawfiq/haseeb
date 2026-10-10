#!/usr/bin/env python3
"""Build the redesigned portfolio into site/ from the original export (the zip).

Content is frozen: this script only
  * removes the old inline <style> blocks, font links and decorative layers
    (empty background divs, custom cursor, old ambient-motion scripts),
  * strips inline style="" attributes (layout leftovers), mapping the few that
    carried meaning (fine print, emphasis) to classes,
  * reorders whole <section> elements (presentation / sequence only),
  * tags sections with a visual stage (night / paper),
  * links the shared stylesheet, scripts and the WebGL stage.

All text, headings, links, images, alt text, forms and SEO markup are copied
byte-for-byte. Run tools/verify_content.py afterwards to prove it.

Usage: python3 tools/build_site.py [path-to-zip]
"""
import os
import re
import shutil
import sys
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP = os.path.join(ROOT, "Muhammad Haseeb Sheikh _ Organic Growth & Healthcare SEO.zip")
OUT = os.path.join(ROOT, "site")

PAGES = ["index.html", "about.html", "cases.html", "case-healthcare-seo.html",
         "method.html", "diagnostic.html", "partners.html", "contact.html",
         "privacy.html", "404.html"]

# Section order per page (ids). Sections not listed keep their relative order
# after the listed ones. "summary" is a wrapper created on the home page.
ORDER = {
    "index.html": ["top", "summary", "proof", "receipts", "meaning", "wait", "how",
                   "brands", "who", "fork", "about", "certs", "faq", "cta"],
    "about.html": ["about-top", "proof", "track", "certs", "brands", "what", "who",
                   "approach", "work", "faq"],
    "method.html": ["m-hero", "m-principle", "m-phases", "m-surface", "m-deliver",
                    "m-proof", "m-principles", "m-cta"],
    "diagnostic.html": ["diag-top", "get", "how", "proof", "faq"],
}

# Visual stage per section id. Night = immersive, Paper = reading evidence.
NIGHT = {
    "index.html": {"top", "summary", "meaning", "fork", "about", "cta"},
    "about.html": {"about-top", "approach"},
    "cases.html": {"cs-hero", "cs-cta"},
    "case-healthcare-seo.html": {"case-hero", "meaning", "voice", "case-cta"},
    "method.html": {"m-hero", "m-principles", "m-cta"},
    "diagnostic.html": {"diag-top", "proof"},
    "partners.html": {"top", "pledge", "risk", "who", "start"},
    "contact.html": {"contact-top", "contact-cta"},
}

# Pages that get the WebGL "climb" stage behind their hero.
GL_PAGES = {"index.html": "top", "case-healthcare-seo.html": "case-hero"}

PORTRAIT = "assets/img-f12f8c9a94dd.jpg"
SRC_DIR = None  # set in main(); used to read intrinsic image sizes


def add_image_dims(body):
    """Give every <img> with a src explicit width/height (its intrinsic size) so the
    browser reserves space before it loads. Attributes only; src/alt untouched."""
    try:
        from PIL import Image
    except ImportError:
        return body
    def fix(m):
        tag = m.group(0)
        if re.search(r"\swidth=", tag) and re.search(r"\sheight=", tag):
            return tag
        src = re.search(r'\ssrc="([^"]+)"', tag)
        if not src or src.group(1).startswith(("http", "data:")):
            return tag
        path = os.path.join(SRC_DIR, src.group(1))
        if not os.path.exists(path):
            return tag
        w, h = Image.open(path).size
        tag = re.sub(r'\s(width|height)="[^"]*"', "", tag)
        end = -2 if tag.endswith("/>") else -1
        return tag[:end].rstrip() + ' width="%d" height="%d"' % (w, h) + tag[end:]
    return re.sub(r"<img\b[^>]*>", fix, body)


def find_element_end(s, start, tag):
    """Index just past the closing tag of the element opening at `start`."""
    depth = 0
    pat = re.compile(r"<(/?)%s\b[^>]*>" % tag, re.I)
    for m in pat.finditer(s, start):
        if m.group(0).endswith("/>"):
            continue
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return m.end()
    raise ValueError("unclosed <%s> at %d" % (tag, start))


def remove_element(s, open_regex, tag="div"):
    """Remove every element whose opening tag matches open_regex (with trailing newline)."""
    while True:
        m = re.search(open_regex, s)
        if not m:
            return s
        end = find_element_end(s, m.start(), tag)
        if end < len(s) and s[end] == "\n":
            end += 1
        s = s[:m.start()] + s[end:]


def map_style(m):
    """Replace an inline style attribute; keep data positions, map meaning to classes."""
    style = m.group(1)
    if re.fullmatch(r"left:[\d.]+%", style):
        return m.group(0)  # position on the average-position scale (data)
    if "--muted" in style or "--faint" in style:
        return ' data-tone="fine"'
    if "--cream" in style and "position" not in style:
        return ' data-tone="em"'
    if "text-transform:uppercase" in style:
        return ' data-tone="kicker"'
    return ""


def merge_tone(s):
    """data-tone attributes become classes, merged into an existing class attr when present."""
    def fix(m):
        tag = m.group(0)
        tone = re.search(r' data-tone="(\w+)"', tag)
        if not tone:
            return tag
        tag = tag.replace(tone.group(0), "")
        cls = "tone-" + tone.group(1)
        if re.search(r'\sclass="', tag):
            return re.sub(r'\sclass="', ' class="%s ' % cls, tag, count=1)
        return tag[:-1].rstrip("/") + ' class="%s"' % cls + (" />" if tag.endswith("/>") else ">")
    return re.sub(r"<[a-zA-Z][^<>]*data-tone=\"\w+\"[^<>]*>", fix, s)


def split_sections(main_html):
    """Split main inner HTML into (prefix, [section blocks], suffix)."""
    blocks, pos, prefix = [], 0, None
    for m in re.finditer(r"<section\b[^>]*>", main_html):
        if m.start() < pos:
            continue
        if prefix is None:
            prefix = main_html[:m.start()]
        end = find_element_end(main_html, m.start(), "section")
        blocks.append(main_html[m.start():end])
        pos = end
        # swallow whitespace between sections
        while pos < len(main_html) and main_html[pos] in "\n ":
            pos += 1
    return prefix or "", blocks, main_html[pos:]


def section_id(block):
    m = re.match(r'<section\b[^>]*\sid="([^"]+)"', block)
    return m.group(1) if m else None


def set_attr(block, name, value):
    head_end = block.index(">")
    return block[:head_end] + ' %s="%s"' % (name, value) + block[head_end:]


def build_page(name, raw):
    s = raw
    if name == "index.html":
        # The export wraps the page in a second "saved page" document; keep the inner one.
        i = s.index("<!DOCTYPE html>")
        s = s[i:]
        s = s[:s.index("</html>") + len("</html>")] + "\n"

    head_end = s.index("</head>")
    head, body = s[:head_end], s[head_end:]

    # ---------- head: drop old styling, link the new system ----------
    head = re.sub(r"(?s)\s*<style\b.*?</style>", "", head)
    head = re.sub(r'\s*<link[^>]+href="https://fonts\.googleapis\.com/css[^"]*"[^>]*>', "", head)
    head = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>', "", head)
    head = re.sub(r'(<meta name="theme-color" content=")[^"]*(")', r"\g<1>#15110C\2", head)
    head += (
        '\n<link rel="preload" href="fonts/schibsted-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>'
        '\n<link rel="stylesheet" href="css/site.css">\n'
    )

    # ---------- body: remove decorative layers ----------
    for rx in [r'<div id="env"', r'<div class="nbg"', r'<div class="neuro-bg"',
               r'<div id="glFallback"', r'<div id="bgscrim"', r'<div id="grain"']:
        body = remove_element(body, rx)
    body = re.sub(r'<div id="cur" aria-hidden="true"></div><div id="curDot" aria-hidden="true"></div>\n?', "", body)

    # old scripts: keep only the functional ones (forms, case filter, lightbox, js flag)
    def keep_script(m):
        code = m.group(0)
        if "ld+json" in code:
            return code
        if any(k in code for k in ("ENDPOINT", "cat-pill", "clight", 'className+=" js"')):
            return code
        return ""
    body = re.sub(r"(?s)<script\b[^>]*>.*?</script>\n?", keep_script, body)

    # inline styles -> nothing / semantic tone classes
    body = re.sub(r'\sstyle="([^"]*)"', map_style, body)
    body = merge_tone(body)

    # duplicate id on the case page: the plain link becomes the quick link
    if name == "case-healthcare-seo.html":
        body = body.replace('<a id="stickyCta" href="diagnostic.html">', '<a id="quickCta" href="diagnostic.html">', 1)

    # ---------- sections: wrap, reorder, stage ----------
    mm = re.search(r"<main\b[^>]*>", body)
    if mm:
        mend = body.rindex("</main>")
        main_open, main_inner = body[mm.start():mm.end()], body[mm.end():mend]
        prefix, blocks, suffix = split_sections(main_inner)

        if name == "index.html":
            # lift the answer-engine summary out of #fork into its own quiet band
            for i, b in enumerate(blocks):
                if section_id(b) == "fork":
                    a = b.index('<div class="ai-answer')
                    e = find_element_end(b, a, "div")
                    summary = ('<section id="summary">\n  <div class="wrap">\n    '
                               + b[a:e] + "\n  </div>\n</section>")
                    blocks[i] = b[:a] + b[e:].lstrip("\n")
                    blocks.insert(1, summary)
                    break

        order = ORDER.get(name)
        if order:
            by_id = {section_id(b): b for b in blocks}
            ordered = [by_id.pop(i) for i in order if i in by_id]
            ordered += [b for b in blocks if section_id(b) in by_id]
            blocks = ordered

        night = NIGHT.get(name, set())
        staged = []
        for b in blocks:
            sid = section_id(b)
            b = set_attr(b, "data-stage", "night" if sid in night else "paper")
            if GL_PAGES.get(name) == sid:
                head_end_b = b.index(">") + 1
                b = (b[:head_end_b] + '\n  <canvas class="gl-stage" aria-hidden="true"></canvas>'
                     + b[head_end_b:])
            staged.append(b)
        main_inner = prefix + "\n".join(staged) + "\n" + suffix
        body = body[:mm.start()] + main_open + main_inner + body[mend:]

        if name == "index.html":
            # keep the chapter rail in the new section order
            rm = re.search(r'(?s)(<nav id="rail"[^>]*>\n)(.*?)(</nav>)', body)
            if rm:
                links = re.findall(r'  <a href="#([\w-]+)".*?</a>\n', rm.group(2))
                items = {l: re.search(r'  <a href="#%s".*?</a>\n' % l, rm.group(2)).group(0) for l in links}
                seq = [i for i in ORDER[name] if i in items] + [l for l in links if l not in ORDER[name]]
                body = body[:rm.start(2)] + "".join(items[i] for i in seq) + body[rm.end(2):]

    # floating CTA pill gets the portrait (decorative; alt="")
    body = body.replace('<div class="sc-in">',
                        '<div class="sc-in">\n    <img class="sc-face" src="%s" alt="" width="40" height="40" data-added>' % PORTRAIT)

    body = add_image_dims(body)

    # body class for page-specific layout
    page_cls = "pg-" + name.replace(".html", "").replace("-", "_")
    body = re.sub(r"<body\b([^>]*)>", lambda m: '<body class="%s"%s>' % (page_cls, m.group(1)), body, count=1)

    scripts = '<script src="js/site.js" defer></script>\n'
    if name in GL_PAGES:
        scripts += '<script src="js/stage.js" defer></script>\n'
    body = body.replace("</body>", scripts + "</body>", 1)

    return head + body


def main():
    zpath = sys.argv[1] if len(sys.argv) > 1 else ZIP
    tmp = tempfile.mkdtemp(prefix="haseeb-src-")
    with zipfile.ZipFile(zpath) as z:
        z.extractall(tmp)
    os.makedirs(OUT, exist_ok=True)
    global SRC_DIR
    SRC_DIR = tmp
    for page in PAGES:
        raw = open(os.path.join(tmp, page), encoding="utf-8").read()
        open(os.path.join(OUT, page), "w", encoding="utf-8").write(build_page(page, raw))
    for item in ["assets", "images"]:
        dst = os.path.join(OUT, item)
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(os.path.join(tmp, item), dst)
    for f in ["favicon.png", "apple-touch-icon.png", "share.jpg"]:
        shutil.copy2(os.path.join(tmp, f), os.path.join(OUT, f))
    shutil.rmtree(tmp)
    print("built", len(PAGES), "pages into", OUT)


if __name__ == "__main__":
    main()
