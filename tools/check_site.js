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
                mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const LAUNCH = { executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] };
const report = { pages: {}, links: {}, keyboard: {}, menu: {}, reducedMotion: {}, noJs: {}, form: {}, cases: {}, failures: [] };
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
        return { overflow, wide, broken, h1, height: document.documentElement.scrollHeight, gl: !!document.querySelector('canvas.gl-stage') };
      });
      if (errors.length) fail(`${name} ${vname}: console errors ${JSON.stringify(errors)}`);
      if (r.overflow > 1) fail(`${name} ${vname}: horizontal overflow ${r.overflow}px ${JSON.stringify(r.wide)}`);
      if (r.broken.length) fail(`${name} ${vname}: broken images ${JSON.stringify(r.broken)}`);
      if (r.h1 !== 1) fail(`${name} ${vname}: expected one h1, found ${r.h1}`);
      report.pages[`${name}-${vname}`] = { ...r, errors, external: [...new Set(external)] };
      // representative viewport shots down the page (lazy images are loaded now)
      if (vname === 'desktop' || ['index', 'case-healthcare-seo', 'cases', 'diagnostic'].includes(name)) {
        const stops = name === 'index' ? 8 : 4;
        for (let i = 1; i <= stops; i++) {
          const y = Math.round((r.height - (vname === 'desktop' ? 900 : 844)) * i / stops);
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
    const ctx = await browser.newContext(VIEWS.mobile); const page = await ctx.newPage();
    await page.goto(BASE + 'cases.html', { waitUntil: 'networkidle' }); await sleep(800);
    await page.click('#burger'); await sleep(450);
    const open = await page.evaluate(() => ({ open: document.getElementById('mobileMenu').classList.contains('open'), expanded: document.getElementById('burger').getAttribute('aria-expanded'), focus: document.activeElement.textContent.trim() }));
    await shot(page, 'mobile-menu-open');
    await page.keyboard.press('Escape'); await sleep(400);
    const closed = await page.evaluate(() => ({ open: document.getElementById('mobileMenu').classList.contains('open'), focus: document.activeElement.id }));
    if (!open.open || open.expanded !== 'true') fail('menu did not open ' + JSON.stringify(open));
    if (closed.open || closed.focus !== 'burger') fail('menu Escape/focus return failed ' + JSON.stringify(closed));
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

  // ---------- diagnostic form validation (existing script) ----------
  {
    const ctx = await browser.newContext(VIEWS.mobile); const page = await ctx.newPage();
    await page.goto(BASE + 'diagnostic.html', { waitUntil: 'networkidle' });
    await page.click('#formSubmit'); await sleep(200);
    const e1 = await page.textContent('#formErr');
    await page.fill('#f-name', 'Test'); await page.fill('#f-email', 'bad'); await page.click('#formSubmit'); await sleep(200);
    const e2 = await page.textContent('#formErr');
    await page.locator('#diagForm-wrap').scrollIntoViewIfNeeded(); await shot(page, 'diagnostic-mobile-form-validation');
    if (e1 !== 'Please add your name.' || e2 !== 'Please add a valid email address.') fail('form validation messages unexpected ' + JSON.stringify([e1, e2]));
    report.form = { empty: e1, badEmail: e2 };
    await ctx.close();
  }

  // ---------- case library filter + expander (existing script) ----------
  {
    const ctx = await browser.newContext(VIEWS.desktop); const page = await ctx.newPage();
    await page.goto(BASE + 'cases.html', { waitUntil: 'networkidle' });
    const vis = () => page.evaluate(() => [...document.querySelectorAll('.cs-card')].filter(c => !c.hidden).length);
    const health = await vis();
    await page.click('.cat-pill[data-cat="saas"]'); await sleep(200); const saas = await vis();
    await page.click('.cat-pill[data-cat="ecom"]'); await sleep(200);
    const empty = await page.evaluate(() => !document.querySelector('[data-empty="ecom"]').hidden);
    await page.click('.cat-pill[data-cat="health"]'); await sleep(200);
    await page.click('.cs-card.flag .cs-toggle'); await sleep(700);
    const expanded = await page.getAttribute('.cs-card.flag .cs-toggle', 'aria-expanded');
    await page.locator('.cs-card.flag .cs-body').scrollIntoViewIfNeeded(); await sleep(300);
    await shot(page, 'cases-desktop-case-expanded');
    if (health !== 5 || saas !== 3 || !empty || expanded !== 'true') fail('case filter/expander ' + JSON.stringify({ health, saas, empty, expanded }));
    report.cases = { health, saas, ecomEmptyShown: empty, expanded };
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

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(report.failures.length ? `\n${report.failures.length} FAILURE(S)` : '\nALL CHECKS PASSED');
  process.exit(report.failures.length ? 1 : 0);
})();
