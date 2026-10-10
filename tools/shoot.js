// Quick screenshot helper: node tools/shoot.js <url> <out.png> [w] [h] [full] [scrollY]
const pw = (() => { try { return require('playwright'); } catch (e) { return require(process.env.PWPATH); } })();
(async () => {
  const [,, url, out, w = 1440, h = 900, full = '0', sy = '0'] = process.argv;
  const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const mobile = +w < 600;
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(url, { waitUntil: 'networkidle' });
  if (+sy) { await p.evaluate(y => window.scrollTo(0, y), +sy); }
  await p.waitForTimeout(2800);
  await p.screenshot({ path: out, fullPage: full === '1' });
  console.log(out, 'errors:', JSON.stringify(errs));
  await b.close();
})();
