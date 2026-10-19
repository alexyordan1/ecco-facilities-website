// Arnés del handler real de /api/submit-quote con bindings simulados (auditoría 2026-10, cambio 11).
// Uso: node scripts/submit-quote-harness.mjs   (desde la raíz del repo; sin red: fetch está simulado)
// Escenarios: el PATCH de HubSpot no blanquea campos; correo al cliente solo si el lead se guardó
// (y aun así HTTP 200 cuando solo llega el correo al dueño, regla 2026-08-18 ítem 13); contacto nuevo con props completas.
import { onRequestPost, BOOKING_URL } from '../functions/api/submit-quote.js';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const calls = [];
function makeFetch(opts) {
  return async (url, init = {}) => {
    const u = String(url); const body = init.body ? (typeof init.body === 'string' ? init.body : String(init.body)) : '';
    calls.push({ url: u, method: init.method || 'GET', body });
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('hubapi.com/crm/v3/objects/contacts/search')) return opts.hubspotDown ? json({ status: 'error' }, 500) : json({ results: opts.existingContact ? [{ id: '555' }] : [] });
    if (u.includes('hubapi.com/crm/v3/objects/contacts')) return opts.hubspotDown ? json({}, 500) : json({ id: '555' });
    if (u.includes('hubapi.com/crm/v3/objects/deals')) return opts.hubspotDown ? json({}, 500) : json({ id: 'd1' });
    if (u.includes('postmarkapp.com')) return json({ MessageID: 'm1' });
    return json({}, 404);
  };
}
async function run(name, opts, body) {
  calls.length = 0; globalThis.fetch = makeFetch(opts);
  const DB = opts.sqlite
    ? { prepare(sql) { const st = opts.sqlite.prepare(sql); return { bind(...args) { return { run: async () => st.run(...args) }; } }; } }
    : { prepare() { return { bind() { return { run: async () => { if (opts.dbDown) throw new Error('D1 down'); return { success: true }; } }; } }; } };
  const env = { HUBSPOT_ACCESS_TOKEN: 'tok', POSTMARK_API_KEY: 'pm', DB };
  const req = new Request('http://localhost:8080/api/submit-quote', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:8080' }, body: JSON.stringify(body) });
  const res = await onRequestPost({ request: req, env, waitUntil() {} });
  const patch = calls.find(c => c.method === 'PATCH' && c.url.includes('/contacts/555'));
  const post = calls.find(c => c.method === 'POST' && /\/contacts$/.test(c.url));
  const pm = calls.filter(c => c.url.includes('postmarkapp')).map(c => { try { return JSON.parse(c.body).To; } catch { return '?'; } });
  console.log(`\n== ${name}: HTTP ${res.status}`);
  if (patch) console.log('  PATCH props keys:', Object.keys(JSON.parse(patch.body).properties).join(','));
  if (post) console.log('  POST  props keys:', Object.keys(JSON.parse(post.body).properties).join(','));
  console.log('  Postmark To:', pm.join(' | ') || '(none)');
  const mails = calls.filter(c => c.url.includes('postmarkapp.com')).map(c => JSON.parse(c.body));
  const ownerHtml = mails.filter(m => m.To !== body.em).map(m => m.HtmlBody).join('\n');
  const clientMail = mails.find(m => m.To === body.em) || null;
  return { status: res.status, patch, post, pm, ownerHtml, clientMail };
}
const base = { formType: 'janitorial', em: 'ana@example.com', fn: 'Ana', ln: '', ph: '', co: '', space: 'Office', size: '1k-3k', days: ['Monday'], timeOfDay: ['morning'], addr: '350 5th Ave, New York, NY 10118' };
let bad = 0;
const a = await run('A existing contact, empty optional fields', { existingContact: true }, base);
if (!a.patch || /lastname|phone|company/.test(Object.keys(JSON.parse(a.patch.body).properties).join(','))) { bad++; console.log('  FAIL: PATCH still carries empty lastname/phone/company'); }
const b = await run('B everything down (D1 + HubSpot)', { dbDown: true, hubspotDown: true }, base);
if (b.pm.includes('ana@example.com') || b.status !== 200) { bad++; console.log('  FAIL: client email sent although nothing stored, or status != 200'); }
const c = await run('C new contact, D1 ok', { existingContact: false }, base);
if (!c.pm.includes('ana@example.com') || c.status !== 200) { bad++; console.log('  FAIL: client email missing or status != 200'); }
// E — number-of-locations chip (2026-10-18, audit UX-13 / MOD-19): the owner email lists it;
// an unknown value is dropped instead of leaking into the table.
const e = await run('E locations chip 2-5', { existingContact: false }, { ...base, locations: '2-5' });
if (!/Locations/.test(e.ownerHtml) || !/2 to 5/.test(e.ownerHtml)) { bad++; console.log('  FAIL: owner email lacks "Locations: 2 to 5"'); }
const e2 = await run('E2 locations tampered value', { existingContact: false }, { ...base, locations: 'xyz' });
if (!e2.pm.length || !/Reference|ECJ-/.test(e2.ownerHtml)) { bad++; console.log('  FAIL: E2 owner email missing (assertion would be vacuous)'); }
if (/Locations/.test(e2.ownerHtml) || /xyz/.test(e2.ownerHtml)) { bad++; console.log('  FAIL: tampered locations value leaked into the owner email'); }
const e3 = await run('E3 locations prototype key', { existingContact: false }, { ...base, locations: 'constructor', timeline: 'constructor' });
if (/Locations|native code|function/.test(e3.ownerHtml)) { bad++; console.log('  FAIL: prototype-key lookup leaked into the owner email'); }
// F — booking link in the client email (2026-10-19, audit UX-12 / MOD-8): same offer as the screen.
const pageUrl = (readFileSync(new URL('../quote.html', import.meta.url), 'utf8').match(/window\.QF_BOOKING_URL\s*=\s*'([^']*)'/) || [])[1];
if (pageUrl !== BOOKING_URL) { bad++; console.log('  FAIL: BOOKING_URL drifted from quote.html QF_BOOKING_URL:', pageUrl, '!=', BOOKING_URL); }
const f = await run('F visit lead (needsSiteWalk)', { existingContact: false }, { ...base, size: 'visit_required', needsSiteWalk: true });
if (!c.clientMail || !f.clientMail) { bad++; console.log('  FAIL: client email missing in C or F'); }
else {
  if (BOOKING_URL) {
    if (!c.clientMail.HtmlBody.includes(BOOKING_URL) || !c.clientMail.HtmlBody.includes('Book a 30-minute call with Alex') || !c.clientMail.TextBody.includes(BOOKING_URL)) { bad++; console.log('  FAIL: regular client email lacks the booking button/link'); }
    if (!f.clientMail.HtmlBody.includes('Book a call to schedule your visit') || !f.clientMail.HtmlBody.includes(BOOKING_URL)) { bad++; console.log('  FAIL: visit-lead client email lacks the visit booking button'); }
  } else if (/Book a/.test(c.clientMail.HtmlBody + f.clientMail.HtmlBody)) { bad++; console.log('  FAIL: booking button rendered although BOOKING_URL is empty'); }
  // Visit lead: one consistent story (visit first, proposal after); regular lead keeps the optional call.
  if (!/quick visit to size the crew/.test(f.clientMail.TextBody) || !/site visit on that call/.test(f.clientMail.TextBody) || /only if you want one/.test(f.clientMail.TextBody) || !/proposal follows right after/.test(f.clientMail.TextBody)) { bad++; console.log('  FAIL: visit-lead email story inconsistent'); }
  if (!/only if you want one/.test(c.clientMail.TextBody) || /site visit on that call|size the crew/.test(c.clientMail.TextBody)) { bad++; console.log('  FAIL: regular email carries visit wording'); }
  if (/pick a time|specialist reaches out/i.test(f.clientMail.HtmlBody + c.clientMail.HtmlBody)) { bad++; console.log('  FAIL: old promise still in the client email'); }
}
// G — entry context (2026-10-19, audit MOD-6): the page that sent the visitor reaches the owner email.
const g = await run('G source with prev_page', { existingContact: false }, { ...base, source: { landing: '/quote.html?service=dayporter', prev_page: '/day-porter.html', bogus: 'x' } });
if (!/prev_page=\/day-porter\.html/.test(g.ownerHtml) || !/service=dayporter/.test(g.ownerHtml) || /bogus/.test(g.ownerHtml)) { bad++; console.log('  FAIL: lead source line lacks prev_page/landing or leaks unknown keys'); }
// D — real SQLite behind the D1 binding: a re-submission without phone/company keeps the stored ones.
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../schema/leads.sql', import.meta.url), 'utf8'));
await run('D1 first submit with phone+company', { existingContact: false, sqlite: db }, { ...base, ph: '(212) 555-0101', co: 'Acme Corp' });
await run('D2 re-submit without phone/company', { existingContact: true, sqlite: db }, base);
const row = db.prepare('SELECT phone, company, first_name, status FROM leads WHERE email = ?').get('ana@example.com');
console.log('  D1 row after re-submit:', JSON.stringify(row));
if (!row || row.phone !== '(212) 555-0101' || row.company !== 'Acme Corp') { bad++; console.log('  FAIL: D1 upsert blanked phone/company'); }
if (db.prepare('SELECT COUNT(*) AS n FROM leads').get().n !== 1) { bad++; console.log('  FAIL: upsert created a second row'); }
console.log(bad ? `\n${bad} FAIL` : '\nharness OK');
