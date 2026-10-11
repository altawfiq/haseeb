// End-to-end checks for the redesigned site, with screenshots.
// Usage: serve site/ (python3 -m http.server 8765 --directory site), then
//   node tools/check_site.js [baseURL] [screenshotDir]
// Uses the pre-installed Chromium. Playwright resolves from node_modules or $PWPATH.
const fs = require('fs');
const path = require('path');
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PWPATH); } })();

const BASE = process.argv[2] || 'http://localhost:8765/';
const OUT = process.argv[3] || path.join(__dirname, '..', 'design', 'implementation-screenshots');
const SITE = path.join(__dirname, '..', 'site');
const PAGES = ['index', 'cases', 'case-healthcare-seo', 'method', 'about', 'diagnostic', 'partners', 'contact', 'privacy', '404'];
const VIEWS = { desktop: { viewport: { width: 1440, height: 900 } },
                mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
                mobile360: { viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
                mobile414: { viewport: { width: 414, height: 896 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] };
const report = { pages: {}, links: {}, keyboard: {}, menu: {}, reducedMotion: {}, noJs: {}, contact: {}, cases: {}, motion: {}, story: {}, failures: [] };
const fail = (m) => { report.failures.push(m); console.log('FAIL', m); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name, opts = {}) {
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 72, ...opts });
}
async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate(v => window.scrollTo(0, v), y); await sleep(60); }
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(500);
}

(async () => {
  const browser = await pw.chromium.launch(LAUNCH);

  // ---------- per page, per viewport ----------
  for (const [vname, vopts] of Object.entries(VIEWS)) {
    for (const name of PAGES) {
      const ctx = await browser.newContext(vopts);
      const page = await ctx.newPage();
      const errors = [], external = [];
      page.on('console', m => { if (m.type() === 'error') (/ERR_TUNNEL|ERR_PROXY|net::/.test(m.text()) ? external : errors).push(m.text()); });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      page.on('requestfailed', r => { const u = r.url(); if (!u.startsWith(BASE)) external.push(u); else errors.push('requestfailed: ' + u); });
      await page.goto(BASE + name + '.html', { waitUntil: 'networkidle' });
      await sleep(2600);
      await shot(page, `${name}-${vname}-top`);
      await scrollThrough(page);
      const r = await page.evaluate(() => {
        const overflow = document.scrollingElement.scrollWidth - innerWidth;
        const wide = [...document.querySelectorAll('body *')].filter(el => { const b = el.getBoundingClientRect(); return b.right > innerWidth + 2 && getComputedStyle(el).position !== 'fixed' && !el.closest('.receipts,.track-sticky,#mobileMenu,footer'); }).slice(0, 5).map(el => el.tagName + '.' + el.className);
        const broken = [...document.images].filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'));
        const h1 = document.querySelectorAll('h1').length;
        // header: visible nav labels stay on one line and nothing spills out of the bar
        const nav = document.getElementById('nav');
        const navLinks = [...document.querySelectorAll('#nav .nav-links a')].filter(a => a.offsetParent);
        const wrapped = navLinks.filter(a => a.getClientRects().length > 1 || a.offsetHeight > 48).map(a => a.textContent.trim());
        const headerOverflow = nav ? nav.scrollWidth - nav.clientWidth : 0;
        const burger = document.getElementById('burger');
        const menuReachable = !nav || navLinks.length > 0 || (burger && burger.offsetParent !== null);  // privacy/404 have no header in the source
        // tap targets: interactive elements at least 24x24 (inline links inside running text excluded)
        const small = [...document.querySelectorAll('a[href], button, summary, select, input, textarea')].filter(el => {
          if (!el.offsetParent || el.closest('[aria-hidden="true"], #mobileMenu')) return false;
          const r = el.getBoundingClientRect(); if (r.width === 0) return false;
          const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && /^(P|LI|SPAN|DD|FIGCAPTION|SMALL|DIV)$/.test(el.parentElement.tagName) && el.parentElement.textContent.trim().length > el.textContent.trim().length + 8;
          return !inline && (r.width < 24 || r.height < 24);
        }).map(el => el.tagName + ' ' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));
        // fixed controls: only the header (and the progress hairline / desktop chapter rail) may be fixed
        const fixed = [...document.querySelectorAll('body *')].filter(el => { const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); return cs.position === 'fixed' && cs.display !== 'none' && cs.visibility !== 'hidden' && b.height > 0 && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth; })
          .map(el => el.id || el.className).filter(id => !['nav', 'progress', 'rail', 'mobileMenu', 'clight'].includes(id));
        return { overflow, wide, broken, h1, height: document.documentElement.scrollHeight, gl: !!document.querySelector('canvas.gl-stage'), wrapped, headerOverflow, menuReachable, small, fixed: [...new Set(fixed)] };
      });
      if (r.wrapped.length) fail(`${name} ${vname}: header labels wrap ${JSON.stringify(r.wrapped)}`);
      if (r.headerOverflow > 1) fail(`${name} ${vname}: header overflows by ${r.headerOverflow}px`);
      if (!r.menuReachable) fail(`${name} ${vname}: no visible navigation or menu button`);
      if (r.small.length) fail(`${name} ${vname}: tap targets under 24px ${JSON.stringify(r.small.slice(0, 6))}`);
      if (r.fixed.length) fail(`${name} ${vname}: fixed controls over content ${JSON.stringify(r.fixed)}`);
      if (errors.length) fail(`${name} ${vname}: console errors ${JSON.stringify(errors)}`);
      if (r.overflow > 1) fail(`${name} ${vname}: horizontal overflow ${r.overflow}px ${JSON.stringify(r.wide)}`);
      if (r.broken.length) fail(`${name} ${vname}: broken images ${JSON.stringify(r.broken)}`);
      if (r.h1 !== 1) fail(`${name} ${vname}: expected one h1, found ${r.h1}`);
      report.pages[`${name}-${vname}`] = { ...r, errors, external: [...new Set(external)] };
      // representative viewport shots down the page (lazy images are loaded now)
      if (vname === 'desktop' || (vname === 'mobile' && ['index', 'case-healthcare-seo', 'cases', 'diagnostic'].includes(name))) {
        const stops = name === 'index' ? 8 : 4;
        for (let i = 1; i <= stops; i++) {
          const y = Math.round((r.height - vopts.viewport.height) * i / stops);
          await page.evaluate(v => window.scrollTo(0, v), y); await sleep(900);
          await shot(page, `${name}-${vname}-${String(i).padStart(2, '0')}`);
        }
      }
      await ctx.close();
      console.log('ok  ', name, vname, JSON.stringify({ overflow: r.overflow, height: r.height, errors: errors.length }));
    }
  }

  // ---------- links & anchors (static, from the built HTML) ----------
  const ids = {}, hrefs = [];
  for (const name of PAGES) {
    const html = fs.readFileSync(path.join(SITE, name + '.html'), 'utf8');
    ids[name + '.html'] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) hrefs.push([name + '.html', m[1]]);
  }
  const external = new Set(); let checked = 0;
  for (const [from, href] of hrefs) {
    if (/^(mailto:|https?:)/.test(href)) { external.add(href.split('?')[0]); continue; }
    checked++;
    const [file, hash] = href.split('#');
    const target = file || from;
    if (!fs.existsSync(path.join(SITE, target))) { fail(`link ${from} -> ${href}: missing file`); continue; }
    if (hash && !(ids[target] || new Set()).has(hash)) fail(`link ${from} -> ${href}: missing #${hash}`);
  }
  for (const name of PAGES) {
    const html = fs.readFileSync(path.join(SITE, name + '.html'), 'utf8');
    for (const m of html.matchAll(/\s(?:src|href)="((?:assets|images|css|js|fonts)\/[^"]+)"/g)) if (!fs.existsSync(path.join(SITE, m[1]))) fail(`asset ${name}: ${m[1]} missing`);
  }
  report.links = { internalChecked: checked, external: [...external] };

  // ---------- keyboard: skip link, visible focus, tab order ----------
  {
    const ctx = await browser.newContext(VIEWS.desktop); const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' }); await sleep(1200);
    const stops = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      stops.push(await page.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); const r = a.getBoundingClientRect();
        return { el: a.tagName + (a.id ? '#' + a.id : '') + ' ' + (a.textContent || '').trim().slice(0, 30), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, visible: r.width > 0 && r.bottom > 0 && r.top < innerHeight }; }));
      if (i === 0) await shot(page, 'keyboard-skip-link-desktop', { clip: { x: 0, y: 0, width: 1440, height: 120 } });
      if (i === 3) await shot(page, 'keyboard-focus-nav-desktop', { clip: { x: 600, y: 0, width: 840, height: 90 } });
    }
    if (!/skip/i.test(stops[0].el) && !/Skip/.test(stops[0].el)) fail('keyboard: first tab stop is not the skip link: ' + stops[0].el);
    const hidden = stops.filter(s => !s.outline || !s.visible);
    if (hidden.length) fail('keyboard: focus not visible on ' + JSON.stringify(hidden));
    await page.keyboard.press('Enter'); // follow whatever is focused? stay deterministic: press skip link
    report.keyboard = { stops };
    await ctx.close();
  }

  // ---------- mobile menu ----------
  {
    const ctx = await browser.newContext(VIEWS.mobile360); const page = await ctx.newPage();
    await page.goto(BASE + 'cases.html', { waitUntil: 'networkidle' }); await sleep(800);
    await page.click('#burger'); await sleep(450);
    const open = await page.evaluate(() => ({ open: document.getElementById('mobileMenu').classList.contains('open'), expanded: document.getElementById('burger').getAttribute('aria-expanded'), focus: document.activeElement.textContent.trim() }));
    await shot(page, 'mobile-menu-open');
    await page.keyboard.press('Escape'); await sleep(400);
    const closed = await page.evaluate(() => ({ open: document.getElementById('mobileMenu').classList.contains('open'), focus: document.activeElement.id }));
    if (!open.open || open.expanded !== 'true') fail('menu did not open ' + JSON.stringify(open));
    if (closed.open || closed.focus !== 'burger') fail('menu Escape/focus return failed ' + JSON.stringify(closed));
    // the menu button must stay on top of the open menu so a tap closes it
    await page.click('#burger'); await sleep(400);
    await page.click('#burger', { timeout: 3000 }).catch(e => fail('menu: burger not tappable while menu is open'));
    await sleep(400);
    const tapClosed = await page.evaluate(() => !document.getElementById('mobileMenu').classList.contains('open'));
    if (!tapClosed) fail('menu: tapping the menu button did not close the menu');
    await page.click('#burger'); await sleep(300); await page.click('#mobileMenu a[href="method.html"]'); await page.waitForLoadState('networkidle');
    const landed = page.url();
    if (!landed.endsWith('method.html')) fail('menu link navigation failed: ' + landed);
    report.menu = { open, closed, landed };
    await ctx.close();
  }

  // ---------- reduced motion (OS setting) and the on-page toggle ----------
  {
    const ctx = await browser.newContext({ ...VIEWS.desktop, reducedMotion: 'reduce' }); const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' }); await sleep(600);
    const s = await page.evaluate(() => ({ rm: document.documentElement.classList.contains('rm-on'), label: document.getElementById('motionLabel').textContent,
      split: document.querySelectorAll('.hero h1 .split-word').length, track: !!document.querySelector('.track-pin') }));
    await shot(page, 'index-desktop-reduced-motion-top');
    await page.evaluate(() => document.getElementById('receipts').scrollIntoView()); await sleep(500);
    await shot(page, 'index-desktop-reduced-motion-dashboards');
    if (!s.rm || s.split || s.track || s.label !== 'Motion: off') fail('reduced motion not honoured ' + JSON.stringify(s));
    await page.evaluate(() => window.scrollTo(0, 0)); await sleep(500);
    await page.click('#motionToggle'); await sleep(300);
    const t = await page.evaluate(() => ({ rm: document.documentElement.classList.contains('rm-on'), label: document.getElementById('motionLabel').textContent, pressed: document.getElementById('motionToggle').getAttribute('aria-pressed') }));
    if (t.rm || t.label !== 'Motion: on') fail('motion toggle did not switch on ' + JSON.stringify(t));
    report.reducedMotion = { os: s, afterToggle: t };
    await ctx.close();
  }

  // ---------- no JavaScript: content still readable ----------
  {
    const ctx = await browser.newContext({ ...VIEWS.desktop, javaScriptEnabled: false }); const page = await ctx.newPage();
    for (const name of ['index', 'case-healthcare-seo']) {
      await page.goto(BASE + name + '.html', { waitUntil: 'load' }); await sleep(400);
      const vis = await page.evaluate(() => { const h = document.querySelector('h1'); const s = getComputedStyle(h); return { text: h.textContent.trim().slice(0, 60), opacity: s.opacity, display: s.display }; });
      if (vis.opacity !== '1' || vis.display === 'none') fail('no-JS: h1 hidden on ' + name);
      report.noJs[name] = vis;
      await shot(page, `${name}-desktop-no-js`);
    }
    await ctx.close();
  }

  // ---------- booking, contact and diagnostic actions (no forms without an endpoint) ----------
  {
    const ctx = await browser.newContext(VIEWS.mobile); const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
    const book = await page.evaluate(() => { const a = [...document.querySelectorAll('.hero a')].find(x => x.textContent.trim() === 'Book a call'); return a ? { href: a.getAttribute('href'), visible: a.getBoundingClientRect().height >= 44 } : null; });
    if (!book || !/^(mailto:|https:)/.test(book.href) || !book.visible) fail('home hero Book a call missing/unusable ' + JSON.stringify(book));
    await page.goto(BASE + 'contact.html', { waitUntil: 'networkidle' });
    const c = await page.evaluate(() => ({ forms: document.querySelectorAll('form').length,
      actions: [...document.querySelectorAll('.chan a')].map(a => [a.querySelector('.ck').textContent.trim(), a.getAttribute('href')]) }));
    const need = { 'Book a call': /^(mailto:|https:)/, 'Email': /^mailto:haseeb7665@gmail\.com$/, 'LinkedIn': /^https:\/\/www\.linkedin\.com\/in\/muhammadhaseebsheikh$/ };
    for (const [k, rx] of Object.entries(need)) { const f = c.actions.find(x => x[0] === k); if (!f || !rx.test(f[1])) fail(`contact: ${k} action missing or wrong ${JSON.stringify(f)}`); }
    if (c.forms) fail('contact: a form is still present');
    await shot(page, 'contact-mobile-actions', { fullPage: false });
    await page.goto(BASE + 'diagnostic.html', { waitUntil: 'networkidle' });
    const d = await page.evaluate(() => ({ forms: document.querySelectorAll('form').length, mail: (document.querySelector('#diagForm-wrap a[href^="mailto:"]') || {}).href || null }));
    if (d.forms) fail('diagnostic: a form is still present (no submission endpoint exists)');
    if (!d.mail || !d.mail.startsWith('mailto:haseeb7665@gmail.com')) fail('diagnostic: email request action missing ' + d.mail);
    await page.locator('#diagForm-wrap').scrollIntoViewIfNeeded(); await sleep(300); await shot(page, 'diagnostic-mobile-email-request');
    report.contact = { book, contact: c, diagnostic: d };
    await ctx.close();
  }

  // ---------- case library filter + expander (existing script) ----------
  {
    const ctx = await browser.newContext(VIEWS.desktop); const page = await ctx.newPage();
    await page.goto(BASE + 'cases.html', { waitUntil: 'networkidle' });
    const vis = () => page.evaluate(() => [...document.querySelectorAll('.cs-card')].filter(c => !c.hidden).length);
    const health = await vis();
    await page.click('.cat-pill[data-cat="saas"]'); await sleep(200); const saas = await vis();
    const empty = await page.evaluate(() => !document.querySelector('.cat-pill[data-cat="ecom"], .cat-pill[data-cat="pro"], .cat-empty'));
    await page.click('.cat-pill[data-cat="health"]'); await sleep(200);
    await page.click('.cs-card.flag .cs-toggle'); await sleep(700);
    const expanded = await page.getAttribute('.cs-card.flag .cs-toggle', 'aria-expanded');
    await page.locator('.cs-card.flag .cs-body').scrollIntoViewIfNeeded(); await sleep(300);
    await shot(page, 'cases-desktop-case-expanded');
    if (health !== 5 || saas !== 3 || !empty || expanded !== 'true') fail('case filter/expander ' + JSON.stringify({ health, saas, empty, expanded }));
    report.cases = { health, saas, noEmptyFutureFilters: empty, expanded };
    await ctx.close();
  }

  // ---------- motion states: pinned track and evidence chapter mid-scroll ----------
  {
    const ctx = await browser.newContext(VIEWS.desktop); const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' }); await sleep(400);
    await shot(page, 'index-desktop-hero-load-0400ms');
    await sleep(1600); await shot(page, 'index-desktop-hero-load-2000ms');
    await scrollThrough(page);
    const pin = await page.evaluate(() => { const p = document.querySelector('.track-pin'); return p ? p.getBoundingClientRect().top + scrollY : null; });
    if (pin === null) fail('pinned dashboard track not built on desktop');
    else {
      for (const [i, f] of [[1, 0.05], [2, 0.5], [3, 0.95]]) {
        const h = await page.evaluate(() => document.querySelector('.track-pin').offsetHeight - innerHeight);
        await page.evaluate(v => window.scrollTo(0, v), Math.round(pin + h * f)); await sleep(700);
        await shot(page, `index-desktop-track-${i}`);
      }
    }
    const proofTop = await page.evaluate(() => document.getElementById('proof').getBoundingClientRect().top + scrollY);
    for (const [i, off] of [[1, 300], [2, 900]]) { await page.evaluate(v => window.scrollTo(0, v), proofTop + off); await sleep(700); await shot(page, `index-desktop-evidence-pinned-${i}`); }
    const wait = await page.evaluate(() => document.getElementById('wait').getBoundingClientRect().top + scrollY);
    await page.evaluate(v => window.scrollTo(0, v), wait - 200); await sleep(600); await shot(page, 'index-desktop-reading-highlight');
    await ctx.close();
  }

  // ---------- the evidence scenes actually move (normal settings) and hold still (reduced motion) ----------
  async function sceneFrames(opts, url, label) {
    const ctx = await browser.newContext(opts); const page = await ctx.newPage();
    await page.goto(BASE + url, { waitUntil: 'networkidle' }); await sleep(2500);
    const box = await page.evaluate(() => { const c = document.querySelector('canvas.gl-stage'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y)), frames: +c.dataset.frames || 0 }; });
    if (!box) { await ctx.close(); return null; }
    const a = await page.screenshot({ clip: box }); await sleep(1200);
    const b = await page.screenshot({ clip: box, path: path.join(OUT, `${label}.png`) });
    const frames = await page.evaluate(() => +document.querySelector('canvas.gl-stage').dataset.frames || 0);
    await shot(page, label + '-view');
    await ctx.close();
    return { moved: !a.equals(b), framesDrawn: frames - box.frames, size: [Math.round(box.width), Math.round(box.height)] };
  }
  for (const [label, opts, url] of [['scene-home-mobile390', VIEWS.mobile, 'index.html'], ['scene-home-mobile360', VIEWS.mobile360, 'index.html'],
                                    ['scene-case-mobile390', VIEWS.mobile, 'case-healthcare-seo.html'], ['scene-home-desktop', VIEWS.desktop, 'index.html'],
                                    ['scene-case-desktop', VIEWS.desktop, 'case-healthcare-seo.html']]) {
    const m = await sceneFrames(opts, url, label);
    if (!m || !m.moved || m.framesDrawn < 10) fail(`${label}: scene not visibly animating ${JSON.stringify(m)}`);
    report.motion[label] = m;
  }
  for (const [label, opts, url] of [['scene-home-mobile-reduced', { ...VIEWS.mobile, reducedMotion: 'reduce' }, 'index.html'], ['scene-case-mobile-reduced', { ...VIEWS.mobile, reducedMotion: 'reduce' }, 'case-healthcare-seo.html']]) {
    const m = await sceneFrames(opts, url, label);
    if (!m || m.moved) fail(`${label}: reduced motion should hold a still frame ${JSON.stringify(m)}`);
    report.motion[label] = m;
  }
  // case study: the stage bar follows the story
  {
    const ctx = await browser.newContext(VIEWS.mobile); const page = await ctx.newPage();
    await page.goto(BASE + 'case-healthcare-seo.html', { waitUntil: 'networkidle' });
    const seen = {};
    for (const id of ['context', 'approach', 'execution', 'results', 'honest']) {
      await page.evaluate(i => { const el = document.getElementById(i); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 100); }, id); await sleep(500);
      seen[id] = await page.evaluate(() => (document.querySelector('.story a.on') || {}).textContent || null);
      if (id === 'results') await shot(page, 'case-mobile-story-bar-results');
    }
    const want = { context: 'Challenge', approach: 'Approach', execution: 'Work', results: 'Results', honest: 'Limits' };
    for (const [k, v] of Object.entries(want)) if (!seen[k] || !seen[k].endsWith(v)) fail(`story bar at #${k}: expected ${v}, got ${seen[k]}`);
    await page.click('.story a[data-for="limits"]'); await sleep(900);
    const jumped = await page.evaluate(() => { const r = document.getElementById('voice').getBoundingClientRect(); const nav = document.getElementById('nav').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
    if (!jumped) fail('story bar link did not bring the Limits chapter into view');
    report.story = { seen, jumped };
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(report.failures.length ? `\n${report.failures.length} FAILURE(S)` : '\nALL CHECKS PASSED');
  process.exit(report.failures.length ? 1 : 0);
})();
