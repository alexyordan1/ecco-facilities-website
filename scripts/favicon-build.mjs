// Rebuilds every favicon asset from the designer's master (images/favicon.svg).
//
//   node scripts/favicon-build.mjs            → option C (cabeza + hojas, trazo engrosado, verde)
//   node scripts/favicon-build.mjs A2         → any other option key (see OPTIONS below)
//   node scripts/favicon-build.mjs --sheet    → also writes a comparison sheet to scripts/out/favicon-options/
//
// Outputs (repo-relative): images/favicon-mark.svg, images/favicon-{16,32,48,96,192,512}.png,
// images/apple-touch-icon.png (180) and favicon.ico (16+32+48, PNG-in-ICO).
// Runs from any cwd; requires the repo's Playwright install (no sharp: its arm64 binary is missing here).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (...p) => path.join(ROOT, ...p);
const argv = process.argv.slice(2);
const CHOICE = argv.find(a => !a.startsWith('--')) || 'C';
const SHEET = argv.includes('--sheet');

const GREEN = '#046307', SAGE = '#9FCB7B', CREAM = '#F4F2EC', NOIR = '#0B0B0B', WHITE = '#FFFFFF';

// ── 1. Extract the master's vectors (path order is fixed by the designer's export) ──
const master = fs.readFileSync(R('images', 'favicon.svg'), 'utf8');
const paths = [...master.matchAll(/<path([^>]*)>/g)].map(m => m[1]);
const d = i => paths[i].match(/\bd="([^"]+)"/)[1];
const P = { head: d(5), leaf1: d(6), leaf1_vein: d(7), leaf2: d(8), leaf2_vein: d(9), leaf2_vein2: d(10), E: d(11), F: d(12),
  E_tx: [100 + 4.249112, 168 + 90.080426], F_tx: [178 + 6.312453, 168 + 90.080426] };

const head = `<path d="${P.head}"/>`;
const leaves = (leafFill, veinFill) => `
  <path fill="${leafFill}" d="${P.leaf1}"/><path fill="${veinFill}" d="${P.leaf1_vein}"/>
  <path fill="${leafFill}" d="${P.leaf2}"/><path fill="${veinFill}" d="${P.leaf2_vein}"/><path fill="${veinFill}" d="${P.leaf2_vein2}"/>`;
const E = `<g transform="translate(${P.E_tx[0]},${P.E_tx[1]})"><path d="${P.E}"/></g>`;
const F = `<g transform="translate(${P.F_tx[0]},${P.F_tx[1]})"><path d="${P.F}"/></g>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 600, height: 600 } });

// ── 2. Measure bounding boxes in the browser ──
await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375" width="375" height="375">
 <g id="EF">${E}${F}</g><g id="leaves">${leaves('#000', '#fff')}</g><g id="headleaves">${head}${leaves('#000', '#fff')}</g></svg>`);
const bb = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('svg > g')].map(g => { const b = g.getBBox(); return [g.id, { x: b.x, y: b.y, w: b.width, h: b.height }]; })));

const fit = (b, pad, S = 512) => {
  const inner = S * (1 - 2 * pad), s = Math.min(inner / b.w, inner / b.h);
  return `translate(${((S - b.w * s) / 2 - b.x * s).toFixed(3)},${((S - b.h * s) / 2 - b.y * s).toFixed(3)}) scale(${s.toFixed(4)})`;
};
const svg = (bg, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<rect width="512" height="512" fill="${bg}"/>${inner}</svg>`;
const mono = (bg, fg, bold) => svg(bg, `<g fill="${fg}"${bold ? ` stroke="${fg}" stroke-width="2.2" stroke-linejoin="round"` : ''} transform="${fit(bb.EF, 0.16)}">${E}${F}</g>`);
const headBold = (bg, fg) => svg(bg, `<g transform="${fit(bb.headleaves, 0.08)}"><g fill="${fg}" stroke="${fg}" stroke-width="7" stroke-linejoin="round">${head}</g>${leaves(fg, bg)}</g>`);

const OPTIONS = {
  A: mono(GREEN, WHITE, false), A2: mono(GREEN, WHITE, true),
  B: svg(GREEN, `<g transform="${fit(bb.leaves, 0.14)}">${leaves(WHITE, GREEN)}</g>`),
  C: headBold(GREEN, WHITE),
  D: mono(NOIR, SAGE, false), D2: mono(NOIR, SAGE, true),
  E: mono(CREAM, GREEN, false),
  F: svg(CREAM, `<g transform="${fit(bb.leaves, 0.14)}">${leaves(GREEN, CREAM)}</g>`),
  G: headBold(NOIR, SAGE),
};
if (!OPTIONS[CHOICE]) { console.error(`Unknown option "${CHOICE}". Known: ${Object.keys(OPTIONS).join(', ')}`); process.exit(1); }

// ── 3. Write the chosen vector + rasters ──
fs.writeFileSync(R('images', 'favicon-mark.svg'), OPTIONS[CHOICE]);
const b64 = Buffer.from(OPTIONS[CHOICE]).toString('base64');
const out = { 16: 'favicon-16.png', 32: 'favicon-32.png', 48: 'favicon-48.png', 96: 'favicon-96.png', 192: 'favicon-192.png', 180: 'apple-touch-icon.png', 512: 'favicon-512.png' };
for (const [s, name] of Object.entries(out)) {
  await page.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${b64}" width="${s}" height="${s}" style="display:block"></body>`);
  await page.screenshot({ path: R('images', name), clip: { x: 0, y: 0, width: +s, height: +s }, omitBackground: true });
}
const sizes = [16, 32, 48], pngs = sizes.map(s => fs.readFileSync(R('images', `favicon-${s}.png`)));
const hdr = Buffer.alloc(6); hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(sizes.length, 4);
let off = 6 + 16 * sizes.length; const dirs = [];
sizes.forEach((s, i) => { const e = Buffer.alloc(16); e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(off, 12); off += pngs[i].length; dirs.push(e); });
fs.writeFileSync(R('favicon.ico'), Buffer.concat([hdr, ...dirs, ...pngs]));

// ── 4. Optional comparison sheet ──
if (SHEET) {
  const dir = R('scripts', 'out', 'favicon-options'); fs.mkdirSync(dir, { recursive: true });
  for (const [k, v] of Object.entries(OPTIONS)) fs.writeFileSync(path.join(dir, `${k}.svg`), v);
  const card = (k, v) => { const src = 'data:image/svg+xml;base64,' + Buffer.from(v).toString('base64'); return `<div class="card"><b>${k}</b><div class="row"><img src="${src}" width="96"><img src="${src}" width="48"><img src="${src}" width="32"><img src="${src}" width="16"></div>
   <div class="serp"><span class="tile"><img src="${src}" width="18"></span><span>Ecco Facilities<br><small>https://eccofacilities.com</small></span></div>
   <div class="serp dark"><span class="tile"><img src="${src}" width="18"></span><span>Ecco Facilities<br><small>https://eccofacilities.com</small></span></div></div>`; };
  const html = `<style>body{font-family:system-ui;padding:20px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.card{border:1px solid #ddd;border-radius:8px;padding:12px}.row{display:flex;align-items:flex-end;gap:12px;margin:8px 0}.serp{display:flex;gap:10px;align-items:center;padding:8px;border-radius:6px;font:13px Arial}.serp.dark{background:#202124;color:#eee}.tile{width:26px;height:26px;border-radius:50%;background:#f1f3f4;display:inline-flex;align-items:center;justify-content:center}.dark .tile{background:#303134}small{color:#777}</style><div class="grid">${Object.entries(OPTIONS).map(([k, v]) => card(k, v)).join('')}</div>`;
  await page.setViewportSize({ width: 1400, height: 900 }); await page.setContent(html);
  await page.screenshot({ path: path.join(dir, 'sheet.png'), fullPage: true });
  console.log('sheet →', dir);
}
await browser.close();
console.log(`favicon assets rebuilt from option ${CHOICE}`);
