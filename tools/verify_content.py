#!/usr/bin/env python3
"""Prove the redesign kept every page's content and SEO surface.

Compares each page in site/ with the original export in the zip:
  * <title>, meta description/robots/author, Open Graph, Twitter, profile tags
  * canonical, icon and apple-touch-icon links
  * JSON-LD blocks (byte-for-byte)
  * every visible text segment (as a multiset; sections may be reordered)
  * heading levels and text, image src + alt, link targets, aria-labels
  * form controls (tag, id, name, type, required) and select options
  * functional inline scripts (forms, filters, lightbox) byte-for-byte

Elements the build adds are marked data-added and ignored.
Exit code 1 on any difference.
"""
import collections
import os
import re
import sys
import tempfile
import zipfile
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP = os.path.join(ROOT, "Muhammad Haseeb Sheikh _ Organic Growth & Healthcare SEO.zip")
SITE = os.path.join(ROOT, "site")
PAGES = ["index.html", "about.html", "cases.html", "case-healthcare-seo.html",
         "method.html", "diagnostic.html", "partners.html", "contact.html",
         "privacy.html", "404.html"]
SEO_META = re.compile(r"^(description|robots|author|og:.*|twitter:.*|profile:.*)$")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "source", "track", "wbr"}


class Extract(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.c = collections.defaultdict(collections.Counter)
        self.stack = []          # open tags
        self.skip = 0            # depth inside script/style/svg-title etc.
        self.added = 0           # depth inside data-added elements
        self.cur_heading = None
        self.heading_text = []
        self.script_type = None
        self.script_buf = []
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "data-added" in a:
            if tag not in VOID:
                self.added += 1
            return
        if self.added:
            if tag not in VOID:
                self.added += 1
            return
        if tag == "title":
            self.in_title = True
        if tag in ("script", "style"):
            self.skip += 1
            self.script_type = a.get("type", "")
            self.script_buf = []
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key and SEO_META.match(key):
                self.c["meta"][(key, a.get("content"))] += 1
        if tag == "link" and a.get("rel") in ("canonical", "icon", "apple-touch-icon"):
            self.c["link"][(a.get("rel"), a.get("href"))] += 1
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.cur_heading = tag
            self.heading_text = []
        if tag == "img":
            self.c["img"][(a.get("src"), a.get("alt"))] += 1
        if tag == "a":
            self.c["href"][a.get("href")] += 1
        if "aria-label" in a:
            self.c["aria"][a["aria-label"]] += 1
        if tag in ("input", "select", "textarea", "button", "form"):
            self.c["form"][(tag, a.get("id"), a.get("name"), a.get("type"), "required" in a)] += 1
        if tag == "option":
            self.c["form"][("option", a.get("value"))] += 1
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if self.added:
            self.added -= 1
            return
        if tag in ("script", "style") and self.skip:
            self.skip -= 1
            code = "".join(self.script_buf)
            if tag == "script":
                if "ld+json" in (self.script_type or ""):
                    self.c["jsonld"][code.strip()] += 1
                elif any(k in code for k in ("ENDPOINT", "cat-pill", "clight")):
                    self.c["script"][code.strip()] += 1
        if tag == "title":
            self.in_title = False
        if tag == self.cur_heading:
            self.c["heading"][(tag, norm("".join(self.heading_text)))] += 1
            self.cur_heading = None
        if self.stack and tag in self.stack:
            while self.stack and self.stack.pop() != tag:
                pass

    def handle_data(self, data):
        if self.added:
            return
        if self.skip:
            self.script_buf.append(data)
            return
        if self.in_title:
            self.c["title"][norm(data)] += 1
            return
        if self.cur_heading:
            self.heading_text.append(data)
        t = norm(data)
        if t:
            self.c["text"][t] += 1


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def extract(html):
    p = Extract()
    p.feed(html)
    return p.c


def original_pages():
    tmp = tempfile.mkdtemp(prefix="haseeb-verify-")
    with zipfile.ZipFile(ZIP) as z:
        z.extractall(tmp)
    out = {}
    for page in PAGES:
        s = open(os.path.join(tmp, page), encoding="utf-8").read()
        if page == "index.html":  # strip the saved-page wrapper, as the build does
            s = s[s.index("<!DOCTYPE html>"):]
            s = s[:s.index("</html>") + 7]
        out[page] = s
    return out


def main():
    orig = original_pages()
    failures = 0
    for page in PAGES:
        new = open(os.path.join(SITE, page), encoding="utf-8").read()
        a, b = extract(orig[page]), extract(new)
        problems = []
        for key in sorted(set(a) | set(b)):
            if a[key] != b[key]:
                missing = a[key] - b[key]
                extra = b[key] - a[key]
                problems.append((key, list(missing.items())[:5], list(extra.items())[:5]))
        if problems:
            failures += 1
            print("FAIL", page)
            for key, missing, extra in problems:
                print("   ", key, "missing:", missing, "extra:", extra)
        else:
            counts = {k: sum(v.values()) for k, v in b.items()}
            print("ok  ", page, counts)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
