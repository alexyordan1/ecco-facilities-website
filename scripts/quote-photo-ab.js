// A/B del warm-up de fotos del quote wizard (auditoría 2026-10 cambio 2).
// Uso: NODE_PATH=node_modules node scripts/quote-photo-ab.js http://localhost:8091 http://localhost:8092
//   arg1 = base URL "antes" (p. ej. una copia del árbol en HEAD servida con serve.js), arg2 = "después" (el árbol de trabajo).
// Camina el flujo janitorial en Chromium (desktop 1280 y móvil 390 @3x) con red Slow/Fast 4G emulada y, por pantalla,
// reporta cuántas de las fotos que necesita se pidieron DESPUÉS del clic y a cuántos ms del clic quedó lista la última.
// Caché HTTP activada a propósito: el warm-up solo sirve si la petición posterior del CSS es un hit.
const { chromium } = require('@playwright/test');
const PROFILES = {
  slow4g: { downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
  fast4g: { downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 1.5 * 1024 * 1024 / 8, latency: 170 },
};
const DEVICES = {
  desktop: { viewport: { width: 1280, height: 800 } },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};
const DWELL = 2500; // ms the "user" reads each screen before acting
const STEPS = [
  ['welcome', async p => p.click('.qf2-card[data-service="janitorial"]')],
  ['space', async p => p.click('.qf2-card[data-space="Office"]')],
  ['size', async p => p.locator('.qf2-size-card').first().click()],
  ['days', async p => { await p.click('#qfScreen_days .qf-day-card[data-day="Monday"]'); await p.click('#qfScreen_days .qf2-chip-time[data-time="morning"]'); await p.click('#qfDaysContinue'); }],
  ['location', async p => { await p.fill('#qfCompanyName', 'Test Co'); await p.fill('#qfAddress', '123 Main St, New York, NY 10001'); await p.click('#qfLocationContinue'); }],
  ['info', async p => { await p.fill('#qfUserFirstName', 'Test'); await p.fill('#qfUserLastName', 'User'); await p.fill('#qfUserEmail', 'test+ab@example.com'); await p.click('#qfInfoContinue'); }],
];
const activeId = p => p.evaluate(() => (document.querySelector('.qf-screen.is-active') || {}).id);
// photos each screen needs (base names; phones use the -800 variant of stage photos)
const NEED = { space: ['ecco-cc-hero-lobby','ecco-v-corporate','ecco-v-medical','ecco-v-retail','ecco-v-restaurant','ecco-v-gym','ecco-v-school'], size: ['hero-office'], days: ['ecco-clean-squeegee-bw'], location: ['int-terracotta'], info: ['ecco-trust-hero'], contact: ['bw-window-pole'] };

async function walk(variant, base, profile, device) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(DEVICES[device]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
  await page.addInitScript(() => { try { localStorage.setItem('ecco_cookies', 'declined'); } catch (_) {} });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...PROFILES[profile] });
  const reqs = new Map(); const cached = new Set(); const done = new Map();
  cdp.on('Network.requestWillBeSent', e => { if (e.request.url.includes('/images/stock/')) reqs.set(e.requestId, { wall: e.wallTime * 1000, ts: e.timestamp }); });
  cdp.on('Network.requestServedFromCache', e => cached.add(e.requestId));
  cdp.on('Network.loadingFinished', e => done.set(e.requestId, e.timestamp));
  await page.goto(`${base}/quote.html`, { waitUntil: 'load' });
  const rows = [];
  for (const [screen, act] of STEPS) {
    await page.waitForTimeout(DWELL);
    const before = await activeId(page);
    const clickWall = Date.now();
    const clickPerf = await page.evaluate(() => performance.now());
    await act(page);
    let after = before;
    for (let i = 0; i < 30 && after === before; i++) { await page.waitForTimeout(100); after = await activeId(page); }
    if (after === before) { // progressive-disclosure Continue
      const btn = page.locator(`#${before} button[id*="Continue"]:visible`).first();
      if (await btn.count()) { await btn.click(); for (let i = 0; i < 30 && after === before; i++) { await page.waitForTimeout(100); after = await activeId(page); } }
    }
    await page.waitForTimeout(4000); // let any post-click photo requests finish
    const nextName = String(after).replace('qfScreen_', '');
    const need = NEED[nextName] || [];
    const m = await page.evaluate(({ need, clickPerf }) => {
      const entries = performance.getEntriesByType('resource').filter(e => e.name.includes('/images/stock/'));
      let ready = 0, late = 0, missing = 0;
      for (const n of need) {
        const e = entries.find(x => x.name.includes('/stock/' + n));
        if (!e) { missing++; continue; }
        if (e.startTime > clickPerf) late++;
        ready = Math.max(ready, Math.round(e.responseEnd - clickPerf));
      }
      return { ready: Math.max(0, ready), late, missing };
    }, { need, clickPerf });
    rows.push(`->${nextName}: ${m.late}/${need.length} pedidas tras el clic, lista a +${m.ready} ms${m.missing ? ' (' + m.missing + ' sin entry)' : ''}`);
  }
  await browser.close();
  return { rows, errors };
}

(async () => {
  for (const profile of ['slow4g', 'fast4g']) for (const device of ['desktop', 'mobile']) {
    for (const [variant, base] of [['before', process.argv[2] || 'http://localhost:8091'], ['after', process.argv[3] || 'http://localhost:8092']]) {
      const r = await walk(variant, base, profile, device);
      console.log(`${profile} ${device} ${variant}: ${r.rows.join(' | ')}${r.errors.length ? '  PAGEERRORS: ' + r.errors.join('; ') : ''}`);
    }
  }
})().catch(e => { console.error('FAILED', e); process.exit(1); });
