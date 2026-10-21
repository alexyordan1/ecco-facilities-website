// Verificación de las fuentes autoalojadas en las páginas de marketing (auditoría PERF-2, 2026-10-21).
// Requiere el servidor local en :8080 (preview "Ecco Website") y ffmpeg para el SSIM.
//
//   node scripts/fonts-selfhost-check.mjs snapshot before   # capturas + informe de fuentes por página
//   node scripts/fonts-selfhost-check.mjs snapshot after
//   node scripts/fonts-selfhost-check.mjs compare           # SSIM before vs after (ffmpeg)
//   node scripts/fonts-selfhost-check.mjs spof              # FCP con Google Fonts normal / retrasado 3 s / bloqueado
//
// Salida en $OUT (por defecto <tmpdir>/ecco-fonts-check, fuera del repo). Reproducible: no depende del scratchpad.
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:8080'; // BASE=https://eccofacilities.com captures the deployed version
const OUT = process.env.OUT || join(tmpdir(), 'ecco-fonts-check'); // outside the repo: nothing to gitignore
const ROOT = fileURLToPath(new URL('..', import.meta.url)); // the repo path has a space: never .pathname
const pages = [
  ...readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => '/' + f),
  ...readdirSync(join(ROOT, 'blog')).filter((f) => f.endsWith('.html')).map((f) => '/blog/' + f),
].sort();
const GOOGLE = /fonts\.(googleapis|gstatic)\.com/;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

async function snapshot(label) {
  const dir = join(OUT, label); mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  // The cookie banner slides in on its own timer and moved the SSIM; it only renders
  // when ecco_cookies is unset, so pre-seed the decline (same trick as the e2e helper).
  await ctx.addInitScript(() => { try { localStorage.setItem('ecco_cookies', 'declined'); } catch (_) {} });
  const report = {};
  for (const p of pages) {
    const page = await ctx.newPage();
    const google = [], local = [];
    page.on('request', (r) => { if (GOOGLE.test(r.url())) google.push(r.url()); if (/\/fonts\/.*\.woff2/.test(r.url())) local.push(r.url()); });
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const faces = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.style} ${f.weight}`).sort());
    const name = p.replace(/^\//, '').replace(/[\/]/g, '__');
    await page.screenshot({ path: join(dir, name + '.png'), clip: { x: 0, y: 0, width: 1280, height: 800 } });
    report[p] = { faces, google: google.length, local: local.length };
    await page.close();
  }
  await browser.close();
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2));
  for (const [p, r] of Object.entries(report)) console.log(`${p.padEnd(52)} google=${r.google} local=${r.local} faces=${r.faces.length}`);
}

function compare() {
  const a = join(OUT, process.env.BEFORE || 'before'), b = join(OUT, process.env.AFTER || 'after');
  const ra = JSON.parse(readFileSync(join(a, 'report.json'), 'utf8')), rb = JSON.parse(readFileSync(join(b, 'report.json'), 'utf8'));
  let worst = 1, bad = 0;
  for (const f of readdirSync(a).filter((x) => x.endsWith('.png'))) {
    if (!existsSync(join(b, f))) { console.log(`MISSING after/${f}`); bad++; continue; }
    // ffmpeg prints the SSIM summary on stderr.
    const r = spawnSync('ffmpeg', ['-loglevel', 'info', '-i', join(a, f), '-i', join(b, f), '-lavfi', 'ssim', '-f', 'null', '-'], { encoding: 'utf8' });
    if (r.error || r.status !== 0) { console.log(`ffmpeg failed on ${f}: ${r.error ? r.error.message : r.stderr.slice(-300)}`); bad++; continue; }
    const m = (r.stderr + r.stdout).match(/All:([0-9.]+)/);
    const ssim = m ? parseFloat(m[1]) : NaN;
    worst = Math.min(worst, ssim);
    const p = '/' + f.replace(/\.png$/, '').replace(/__/g, '/');
    const fa = (ra[p] || {}).faces || [], fb = (rb[p] || {}).faces || [];
    const sameFaces = JSON.stringify(fa) === JSON.stringify(fb);
    // Google splits each family into more unicode-range faces than fonts.css, so the
    // face count is informational; the pixels and the absence of Google requests decide.
    const flag = !(ssim >= 0.98) || (rb[p] || {}).google !== 0 ? '  <-- CHECK' : ''; // NaN counts as a failure
    if (flag) bad++;
    console.log(`${p.padEnd(52)} SSIM ${ssim.toFixed(4)}  faces ${fa.length}->${fb.length}${sameFaces ? '' : ' (split differs)'}  google after=${(rb[p] || {}).google}${flag}`);
  }
  console.log(`\nworst SSIM ${worst.toFixed(4)}; pages flagged: ${bad}`);
}

async function spof() {
  const targets = ['/index.html', '/janitorial.html', '/blog/janitorial-vs-day-porter.html'];
  const browser = await chromium.launch();
  for (const mode of ['normal', 'delayed', 'blocked']) {
    for (const p of targets) {
      const fcps = [];
      for (let i = 0; i < 3; i++) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await ctx.newPage();
        if (mode !== 'normal') await page.route(GOOGLE, async (route) => {
          if (mode === 'blocked') return route.abort();
          await new Promise((r) => setTimeout(r, 3000)); return route.continue();
        });
        await page.goto(BASE + p, { waitUntil: 'load' });
        // The paint entry can land after `load` on a very fast page: observe it (buffered) with a cap.
        const fcp = await page.evaluate(() => new Promise((resolve) => {
          const done = (e) => resolve(Math.round(e.startTime));
          const hit = performance.getEntriesByName('first-contentful-paint')[0];
          if (hit) return done(hit);
          const obs = new PerformanceObserver((list) => { const e = list.getEntriesByName('first-contentful-paint')[0]; if (e) { obs.disconnect(); done(e); } });
          obs.observe({ type: 'paint', buffered: true });
          setTimeout(() => resolve(-1), 5000);
        }));
        fcps.push(fcp);
        await ctx.close();
      }
      console.log(`${mode.padEnd(8)} ${p.padEnd(40)} FCP median ${median(fcps)} ms  (${fcps.join('/')})`);
    }
  }
  await browser.close();
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'snapshot') await snapshot(arg || 'before');
else if (cmd === 'compare') compare();
else if (cmd === 'spof') await spof();
else { console.log('usage: snapshot before|after | compare | spof'); process.exit(1); }
