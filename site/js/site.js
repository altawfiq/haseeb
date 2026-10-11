/* Shared behaviour for every page. Content stays in HTML; this only adds
   presentation. Everything degrades to a static, readable page when
   JavaScript is off, when the OS asks for reduced motion, or when the
   on-page "Motion" toggle is switched off. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  var mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  var KEY = "hs-motion";
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var reduced = stored() ? stored() === "off" : mqReduce.matches;
  var listeners = [];
  function still() { return reduced; }
  function onMotionChange(fn) { listeners.push(fn); }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- motion toggle (existing control, existing labels) ---------- */
  var mt = $("#motionToggle"), ml = $("#motionLabel");
  function applyMotion(off, persist) {
    reduced = off;
    doc.classList.toggle("rm-on", off);
    if (mt) { mt.setAttribute("data-on", off ? "false" : "true"); mt.setAttribute("aria-pressed", off ? "true" : "false"); }
    if (ml) ml.textContent = off ? "Motion: off" : "Motion: on";
    if (persist) store(off ? "off" : "on");
    listeners.forEach(function (fn) { fn(off); });
  }
  applyMotion(reduced, false);
  if (mt) mt.addEventListener("click", function () { applyMotion(!reduced, true); });
  window.hsMotion = { still: still, on: onMotionChange };

  /* ---------- header: scrolled state, progress, chapter label ---------- */
  var nav = $("#nav"), prog = $("#progress"), chapter = $("#navChapter");
  var chapterSecs = $$("main section[data-chapter]");
  var defaultChapter = chapter ? chapter.textContent : "";
  var lastY = 0;
  function onScrollHeader() {
    var y = window.scrollY || doc.scrollTop;
    var max = doc.scrollHeight - innerHeight;
    if (prog) prog.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (nav) {
      nav.classList.toggle("scrolled", y > 10);
      var menuOpen = mm && mm.classList.contains("open");
      nav.classList.toggle("hide", !menuOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove("hide");
    }
    lastY = y;
    if (chapter && chapterSecs.length) {
      var label = defaultChapter;
      for (var i = 0; i < chapterSecs.length; i++) {
        var r = chapterSecs[i].getBoundingClientRect();
        if (r.top < innerHeight * 0.4) label = chapterSecs[i].getAttribute("data-chapter");
      }
      if (chapter.textContent !== label) chapter.textContent = label;
    }
  }

  /* ---------- mobile menu (existing dialog) ---------- */
  var burger = $("#burger"), mm = $("#mobileMenu"), mclose = $("#menuClose");
  function setMenu(open) {
    if (!mm || !burger) return;
    mm.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle("menu-open", open);
    if (nav) nav.classList.remove("hide");
    if (open) { var first = $("a, button", mm); if (first) first.focus(); }
    else burger.focus({ preventScroll: true });
  }
  if (burger && mm) {
    if (!mm.id) mm.id = "mobileMenu";
    burger.setAttribute("aria-controls", mm.id);
    burger.addEventListener("click", function () { setMenu(!mm.classList.contains("open")); });
    if (mclose) mclose.addEventListener("click", function () { setMenu(false); });
    $$("a", mm).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (!mm.classList.contains("open")) return;
      if (e.key === "Escape") { setMenu(false); return; }
      if (e.key === "Tab") { // keep focus inside the open menu (burger stays reachable to close it)
        var f = [burger].concat($$("a, button", mm));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    addEventListener("resize", function () { if (innerWidth > 960 && !nav.classList.contains("compact") && mm.classList.contains("open")) setMenu(false); });
  }

  /* ---------- header: collapse to the menu before labels get cramped ---------- */
  function fitNav() {
    if (!nav) return;
    var links = $(".nav-links", nav);
    if (!links) return;
    nav.classList.remove("compact");
    if (innerWidth <= 960) return;
    var overflow = nav.scrollWidth > nav.clientWidth + 1;
    var wrapped = $$("a", links).some(function (a) { return a.getClientRects().length > 1 || a.offsetHeight > 48; });
    var tight = links.getBoundingClientRect().left - ($(".brand", nav) || links).getBoundingClientRect().right < 24;
    if (overflow || wrapped || tight) nav.classList.add("compact");
  }
  fitNav();
  addEventListener("resize", fitNav, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);

  /* the chapter rail is a visual aid (aria-hidden): keep it out of the tab order */
  $$("#rail a").forEach(function (a) { a.tabIndex = -1; });

  /* ---------- case study: stage bar follows the story ---------- */
  var story = $(".story"), storyLinks = story ? $$("a", story) : [];
  var storySecs = $$("section[data-story]");
  function onScrollStory() {
    if (!story) return;
    var line = innerHeight * 0.35, current = null;
    storySecs.forEach(function (s) { if (s.getBoundingClientRect().top < line) current = s.getAttribute("data-story"); });
    var idx = -1;
    storyLinks.forEach(function (a, i) { if (a.getAttribute("data-for") === current) idx = i; });
    storyLinks.forEach(function (a, i) {
      a.classList.toggle("on", i === idx); a.classList.toggle("done", i < idx);
      if (i === idx) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
    });
    var first = storySecs[0], last = storySecs[storySecs.length - 1];
    if (first && last) {
      var top = first.getBoundingClientRect().top + scrollY, end = last.getBoundingClientRect().bottom + scrollY - innerHeight;
      story.style.setProperty("--p", clamp((scrollY - top + line) / Math.max(1, end - top + line), 0, 1).toFixed(3));
    }
    var box = storyLinks.length ? storyLinks[0].parentNode : null;
    if (idx >= 0 && box && box.scrollWidth > box.clientWidth) {
      var a = storyLinks[idx];
      if (a.offsetLeft < box.scrollLeft || a.offsetLeft + a.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollLeft = a.offsetLeft - 16;
    }
  }

  /* ---------- floating CTA pill ---------- */
  var pill = $("#stickyCta");
  var pillHide = [];
  if (pill) {
    var sel = pill.getAttribute("data-hide");
    if (sel) { var h = $(sel); if (h) pillHide.push(h); }
    $$("footer, form, .form-card, #cta, .finalcta").forEach(function (el) { pillHide.push(el); });
    if (document.body.classList.contains("pg-case_healthcare_seo")) pill.style.display = "none";
  }
  var heroEl = $("main > section");
  function onScrollPill() {
    if (!pill) return;
    var y = window.scrollY || doc.scrollTop;
    var past = heroEl ? y > heroEl.offsetTop + heroEl.offsetHeight * 0.6 : y > 560;
    var blocked = pillHide.some(function (el) {
      var r = el.getBoundingClientRect();
      return r.top < innerHeight - 40 && r.bottom > 0;
    });
    var show = past && !blocked && !(mm && mm.classList.contains("open"));
    pill.classList.toggle("show", show);
    pill.setAttribute("aria-hidden", show ? "false" : "true");
    $$("a", pill).forEach(function (a) { a.tabIndex = show ? 0 : -1; });
  }

  /* ---------- home chapter rail ---------- */
  var rail = $("#rail");
  var railLinks = rail ? $$("a", rail) : [];
  function onScrollRail() {
    if (!railLinks.length) return;
    var current = null;
    railLinks.forEach(function (a) {
      var t = $(a.getAttribute("href"));
      if (t && t.getBoundingClientRect().top < innerHeight * 0.45) current = a;
    });
    railLinks.forEach(function (a) { a.classList.toggle("on", a === current); });
  }

  /* ---------- headline: blur → sharp, word by word (one moment per page) ---------- */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement("span");
            s.className = "split-word"; s.style.setProperty("--i", i++); s.textContent = p;
            frag.appendChild(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    })(el);
  }
  var headline = $(".pg-index .hero h1, .case-title");
  if (headline && !still()) {
    splitWords(headline);
    headline.classList.add("blur-in");
    $$(".pg-index .hero .payoff, .pg-index .hero .sub, .pg-index .hero .cta2, .pg-index .hero .signature, .pg-index .hero .eyebrow2").forEach(function (el, k) {
      el.classList.add("rise-in"); el.style.setProperty("--d", (650 + k * 110) + "ms");
    });
  }

  /* ---------- count-ups (existing data-count markup) ---------- */
  function finalText(v) {
    return (v.dataset.prefix || "") + (parseFloat(v.dataset.count) || 0).toFixed(parseInt(v.dataset.dec || "0", 10)) + (v.dataset.suffix || "");
  }
  function countUp(v) {
    if (still()) { v.textContent = finalText(v); return; }
    var t = parseFloat(v.dataset.count) || 0, d = parseInt(v.dataset.dec || "0", 10), st = null;
    function f(ts) {
      if (!st) st = ts;
      var q = Math.min(1, (ts - st) / 1400), e = 1 - Math.pow(1 - q, 3);
      v.textContent = (v.dataset.prefix || "") + (t * e).toFixed(d) + (v.dataset.suffix || "");
      if (q < 1) requestAnimationFrame(f); else v.textContent = finalText(v);
    }
    requestAnimationFrame(f);
  }

  /* ---------- one-shot "in view" states ---------- */
  function inView(els, cb, threshold) {
    if (!("IntersectionObserver" in window)) { els.forEach(cb); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } });
    }, { threshold: threshold || 0.3 });
    els.forEach(function (el) { io.observe(el); });
  }
  inView($$("[data-cu]"), function (g) {
    $$(".cu", g).forEach(function (v) { if (!v.dataset.done) { v.dataset.done = "1"; countUp(v); } });
  }, 0.4);
  inView($$(".waitwrap"), function (el) { el.classList.add("in"); }, 0.35);

  // case study: before/after bars and the average-position move (19 → 6.5)
  $$(".ba-bar .fill").forEach(function (f) { if (still()) f.style.width = f.getAttribute("data-w"); });
  inView($$(".results-band"), function (band) {
    $$(".fill", band).forEach(function (f) { f.style.width = f.getAttribute("data-w"); });
  }, 0.3);
  var posA = $(".pos-pt.a"), posB = $(".pos-pt.b");
  if (posA && posB && !still()) {
    var target = posA.style.left;
    posA.style.transition = "none"; posA.style.left = posB.style.left;
    inView([posA.parentNode], function () {
      requestAnimationFrame(function () { posA.style.transition = ""; posA.style.left = target; });
    }, 0.6);
  }

  /* ---------- evidence chapter: light rises as the proof steps past ---------- */
  var proof = $(".pg-index #proof");
  function onScrollProof() {
    if (!proof) return;
    var r = proof.getBoundingClientRect();
    var p = clamp((innerHeight - r.top) / (r.height + innerHeight * 0.2), 0, 1);
    proof.style.setProperty("--glow", still() ? 0.5 : p.toFixed(3));
  }

  /* ---------- reading highlight: words light up as the paragraph is read ---------- */
  var readEl = $(".pg-index #wait .lead");
  var readWords = [];
  function prepRead() {
    if (!readEl || readWords.length) return;
    splitWords(readEl);
    readWords = $$(".split-word", readEl);
    readWords.forEach(function (w) { w.classList.add("w"); });
  }
  function onScrollRead() {
    if (!readEl) return;
    if (still()) { readWords.forEach(function (w) { w.style.opacity = ""; }); return; }
    prepRead();
    var r = readEl.getBoundingClientRect();
    var p = clamp((innerHeight * 0.85 - r.top) / (innerHeight * 0.55), 0, 1);
    var lit = p * readWords.length;
    readWords.forEach(function (w, i) { w.style.opacity = clamp(lit - i + 1, 0.22, 1).toFixed(2); });
  }

  /* ---------- six dashboards: pinned horizontal track (Fiasco) ---------- */
  var receipts = $(".pg-index .receipts");
  var track = null;
  function trackWanted() { return receipts && !still() && innerWidth > 960 && innerHeight > 640; }
  function buildTrack() {
    if (track || !trackWanted()) return;
    var pin = document.createElement("div"); pin.className = "track-pin";
    var sticky = document.createElement("div"); sticky.className = "track-sticky";
    receipts.parentNode.insertBefore(pin, receipts);
    pin.appendChild(sticky); sticky.appendChild(receipts);
    var count = document.createElement("div"); count.className = "track-count"; count.setAttribute("aria-hidden", "true");
    sticky.appendChild(count);
    receipts.closest("section").classList.add("is-track");
    track = { pin: pin, sticky: sticky, count: count, cards: $$(".rcard", receipts) };
    sizeTrack();
  }
  function destroyTrack() {
    if (!track) return;
    track.pin.parentNode.insertBefore(receipts, track.pin);
    track.pin.parentNode.removeChild(track.pin);
    receipts.style.transform = "";
    track.cards.forEach(function (c) { c.style.transform = ""; });
    receipts.closest("section").classList.remove("is-track");
    track = null;
  }
  function sizeTrack() {
    if (!track) return;
    var dist = Math.max(0, receipts.scrollWidth - track.sticky.clientWidth);
    track.dist = dist;
    track.pin.style.height = (dist + innerHeight) + "px";
  }
  function onScrollTrack() {
    if (trackWanted() && !track) buildTrack();
    if (!trackWanted() && track) destroyTrack();
    if (!track) return;
    var r = track.pin.getBoundingClientRect();
    var p = clamp(-r.top / Math.max(1, track.dist), 0, 1);
    receipts.style.transform = "translate3d(" + (-p * track.dist).toFixed(1) + "px,0,0)";
    var mid = innerWidth / 2, nearest = 0, best = 1e9;
    track.cards.forEach(function (c, i) {
      var cr = c.getBoundingClientRect();
      var off = (cr.left + cr.width / 2 - mid) / innerWidth;
      if (Math.abs(off) < best) { best = Math.abs(off); nearest = i; }
      c.style.transform = "rotate(" + clamp(off * 7, -6, 6).toFixed(2) + "deg) translateY(" + (Math.abs(off) * 28).toFixed(1) + "px)";
    });
    track.count.textContent = String(nearest + 1).padStart(2, "0") + " / " + String(track.cards.length).padStart(2, "0");
  }

  /* ---------- scroll loop ---------- */
  var ticking = false;
  function frame() {
    ticking = false;
    onScrollHeader(); onScrollPill(); onScrollRail(); onScrollStory(); onScrollProof(); onScrollRead(); onScrollTrack();
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", function () { sizeTrack(); req(); }, { passive: true });
  addEventListener("load", function () { sizeTrack(); req(); });
  onMotionChange(function () { req(); });
  if (mqReduce.addEventListener) mqReduce.addEventListener("change", function (e) { if (!stored()) applyMotion(e.matches, false); });
  frame();
})();
