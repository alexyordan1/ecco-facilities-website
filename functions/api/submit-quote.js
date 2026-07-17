const ALLOWED_ORIGINS = [
  'https://eccofacilities.com',
  'https://www.eccofacilities.com',
  'http://localhost:8080'
];

// AYS Ola 3 #5 — CORS tightening. We no longer accept any *.pages.dev origin,
// only the specific preview branch defined via env. An attacker-owned
// attacker.pages.dev can no longer post quotes from their page. Any request
// from an unapproved origin falls back to the canonical production domain.
function resolveCors(origin, env) {
  if (!origin) return 'https://eccofacilities.com';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  const previewDomain = env && env.ALLOWED_PREVIEW_ORIGIN;
  if (previewDomain && origin === previewDomain) return origin;
  return 'https://eccofacilities.com';
}

// AYS Ola 3 #18 — redact PII before logging. Never ship email/phone to
// Logpush / Sentry / LogRocket without masking. Covers the three common shapes
// found in error messages.
function redactPII(s) {
  if (s == null) return s;
  return String(s)
    .replace(/([A-Za-z0-9._%+\-]{1,2})[A-Za-z0-9._%+\-]*@([A-Za-z0-9.\-]+\.[A-Za-z]{2,24})/g, '$1***@$2')
    .replace(/\b(\+?\d[\d\s\-().]{6,}\d)\b/g, '***phone***');
}

// AYS Ola 3 #6 — strict email regex. Rejects `..user@`, `user..name@`,
// `user@-domain.com`, and trailing-hyphen domains. MUST match the client-side
// regex in js/quote-flow.js (line ~906) byte-for-byte.
// FIX 2026-06-24 (C2): lookbehind-free — mirror of client. (?<!\.) threw on
// Safari/iOS <=16.3; equivalent = local part 1+ allowed chars not ending in dot.
const EMAIL_RE = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]*[A-Za-z0-9_%+\-]@(?!-)[A-Za-z0-9](?:[A-Za-z0-9.\-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/;

// AYS Ola 3 #7 — rate-limit /api/submit-quote. Uses Cloudflare KV with hourly
// buckets. Limit: 10 submits per IP per hour. Falls open (skip limit) if KV is
// not bound — that way local dev still works, but production should always have
// the RATE_LIMIT_KV binding configured.
// AYS Ola 3 Commit G #36 — if CF-Connecting-IP is missing (direct-to-origin call
// bypassing CF edge), fall back to a much stricter 2/hr limit so a single bot
// can't exhaust the shared "unknown" bucket for everyone else.
// AYS Ola 4 Commit K CR-2 — KV doesn't offer atomic CAS. We mitigate the race by
// re-reading after write and logging soft-limit overshoots (observability hook).
// Hard-limit bypass still possible by ≤N concurrent workers; documented.
async function enforceRateLimit(request, env) {
  const kv = env && env.RATE_LIMIT_KV;
  if (!kv) return { ok: true };
  const ip = request.headers.get('CF-Connecting-IP');
  const isUnknown = !ip;
  const bucket = ip || 'unknown';
  // Ola 1 #5 — tightened from 10→8/hr to narrow the concurrency-race bypass
  // window. Real businesses rarely need >8 submits/hr; spammers need much more.
  const limit = isUnknown ? 2 : 8;
  const hour = Math.floor(Date.now() / 3600000);
  const key = `rl:quote:${bucket}:${hour}`;
  const current = parseInt(await kv.get(key) || '0', 10);
  if (current >= limit) {
    return { ok: false, retryAfter: 3600 - Math.floor((Date.now() / 1000) % 3600) };
  }
  // Write the incremented value. Under concurrency this is best-effort —
  // two concurrent reads of `current` can both pass the check and both write.
  // The re-read below lets us log the overshoot so ops can spot abuse.
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  const after = parseInt(await kv.get(key) || '0', 10);
  // Ola 1 #5 — tightened overshoot threshold +2→+1 for earlier alerting.
  if (after > limit + 1) {
    console.error('[submit-quote] rate-limit overshoot', { bucket, limit, after });
  }
  return { ok: true };
}

// AYS Ola 3 #27 — sanitize form data before embedding in HubSpot property.
// Strips control chars that could break downstream JSON/CSV parsing.
// AYS Ola 3 Commit G #35 — preserve `\n` (0x0A) and `\t` (0x09) so multi-line
// notes survive the round-trip to HubSpot's ecco_form_data property.
function safeStringify(obj) {
  const CTRL_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g; // excludes \t (0x09) and \n (0x0A)
  const clean = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null) continue;
    if (Array.isArray(v)) clean[k] = v.map(x => typeof x === 'string' ? x.replace(CTRL_RE, ' ') : x);
    else if (typeof v === 'string') clean[k] = v.replace(CTRL_RE, ' ');
    else clean[k] = v;
  }
  return JSON.stringify(clean);
}

const ALLOWED_FORM_TYPES = new Set(['janitorial', 'dayporter', 'both']);

// AYS Ola 4 Commit K HI-8 — wrap fetch with AbortController so a slow/hung
// upstream integration can't block the Cloudflare Worker indefinitely.
// CF Workers have a 30s total wall-clock; we pick 8s per call so 2-3 serial
// integrations still fit comfortably under the limit.
function fetchWithTimeout(input, init = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init.signal || controller.signal;
  return fetch(input, { ...init, signal })
    .finally(() => clearTimeout(id));
}

// 2026-07-10 — the quote emails moved off Postmark templates onto raw /email
// (subject + HTML are now versioned here). Because HtmlBody is not auto-escaped
// like Mustachio template vars were, EVERY user-supplied value interpolated into
// the markup below MUST pass through escapeHtml first, or a name/company/notes
// field could break the HTML or inject markup.
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_LOGO_DARK = 'https://eccofacilities.com/images/logo-horizontal.png';

// Client-facing quote confirmation — "Framed Stationery" design (approved
// 2026-07-10). Email-client-safe: table layout + inline styles + web-safe
// serif. Returns { subject, html, text }.
export function buildClientEmail({ firstName, refNumber, serviceLabel }) {
  const name = String(firstName || '').replace(/\s+/g, ' ').trim();
  const subject = name
    ? `Thanks, ${name} — we've received your request`
    : `We've received your request — Ecco Facilities`;
  const greetHtml = name
    ? `Thanks, ${escapeHtml(name)} &mdash; we&rsquo;ve got everything we need.`
    : `Thanks &mdash; we&rsquo;ve got everything we need.`;
  const greetText = name
    ? `Thanks, ${name} — we've got everything we need.`
    : `Thanks — we've got everything we need.`;
  const ref = escapeHtml(refNumber);
  const svc = escapeHtml(serviceLabel);

  const step = (numeral, text, last) => `
                <tr><td style="padding:13px 0;border-top:1px solid #EEE8D6;${last ? 'border-bottom:1px solid #EEE8D6;' : ''}font-family:Georgia,'Times New Roman',serif;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td valign="top" style="width:34px;font-size:18px;color:#B58A2E;font-weight:bold;font-family:Georgia,serif;">${numeral}</td>
                    <td style="font-size:14.5px;line-height:1.55;color:#3D3E30;font-family:Georgia,serif;">${text}</td>
                  </tr></table>
                </td></tr>`;

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#EAE7DE;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">We&rsquo;ve received your request &mdash; here&rsquo;s what happens next.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EAE7DE;">
  <tr><td align="center" style="padding:30px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#FFFDF8;border:1px solid #C9C1AC;">
      <tr><td style="padding:10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4DDC9;">
          <tr><td style="padding:38px 44px 32px;">
            <div style="text-align:center;">
              <img src="${EMAIL_LOGO_DARK}" alt="Ecco Facilities" width="170" style="width:170px;max-width:170px;height:auto;border:0;display:inline-block;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8A8467;margin-top:12px;">Commercial Cleaning &middot; New York</div>
            </div>
            <div style="height:1px;background:#E4DDC9;line-height:1px;font-size:0;margin:26px 0 28px;">&nbsp;</div>
            <div style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.3;color:#191A12;font-weight:bold;">${greetHtml}</div>
            <div style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.72;color:#3D3E30;margin-top:16px;">Thank you for sharing the details of your space. Our team is already reviewing them, and we&rsquo;ll follow up within one business day with a proposal built around exactly what you asked for.</div>
            <div style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6E6A4F;margin-top:28px;">Re:&nbsp; Proposal <span style="color:#191A12;font-weight:bold;">${ref}</span> &middot; ${svc}</div>
            <div style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8A8467;margin-top:30px;">What happens next</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${step('I', 'We review the details you shared &mdash; nothing more needed from you.', false)}${step('II', 'We prepare your proposal, tailored to your space, schedule, and priorities.', false)}${step('III', 'A specialist reaches out to walk you through it and answer any questions.', true)}
            </table>
            <div style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.65;color:#3D3E30;margin-top:26px;">Have a question in the meantime? Email us anytime at <a href="mailto:info@eccofacilities.com" style="color:#5A6E22;text-decoration:none;">info@eccofacilities.com</a>.</div>
            <div style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#191A12;margin-top:24px;">Warm regards,</div>
            <div style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:#6E6A4F;margin-top:2px;">The Ecco Facilities team</div>
            <div style="border-top:1px solid #E4DDC9;margin-top:28px;padding-top:20px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:10.5px;line-height:1.7;color:#9A9578;">Ecco Facilities LLC &middot; 54 State St #804, Albany, NY 12207</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:10.5px;line-height:1.7;color:#9A9578;">Eco-certified products &middot; Commercial cleaning &amp; day porter &middot; Serving New York City</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:10.5px;line-height:1.7;color:#9A9578;">eccofacilities.com</div>
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = `${greetText}

Thank you for sharing the details of your space. Our team is already reviewing them, and we'll follow up within one business day with a proposal built around exactly what you asked for.

Re: Proposal ${refNumber} · ${serviceLabel}

What happens next
  I.   We review the details you shared — nothing more needed from you.
  II.  We prepare your proposal, tailored to your space, schedule, and priorities.
  III. A specialist reaches out to walk you through it and answer any questions.

Have a question in the meantime? Email us anytime at info@eccofacilities.com.

Warm regards,
The Ecco Facilities team

Ecco Facilities LLC · 54 State St #804, Albany, NY 12207
Eco-certified products · Commercial cleaning & day porter · Serving New York City
eccofacilities.com`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Lead field formatting (2026-07-10). The internal email must render EVERY
// field a prospect can submit, human-readable, with NO "[object Object]" and no
// lost data — so the team never needs to open the CRM. The quote form
// (js/quote-flow.js) sends several complex shapes: porter_schedule (dpPorters)
// is an array of { id, days[], hoursMode, sameStart, sameEnd, customHours{} }
// objects, porter_hours (porterHours) is an array of { start, end }. Naive
// String()/join dropped these to "[object Object]". These helpers mirror the
// form's own dpFmtTime / dpFmtDays so the email reads exactly like the wizard.
// ---------------------------------------------------------------------------
const DP_DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DP_DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

// "16:00" -> "4 PM", "09:30" -> "9:30 AM"
function fmtTime12(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm == null ? '' : hhmm).trim());
  if (!m) return String(hhmm == null ? '' : hhmm);
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return min === 0 ? `${h} ${period}` : `${h}:${String(min).padStart(2, '0')} ${period}`;
}

// ['Monday','Wednesday','Friday'] -> "Mon, Wed, Fri" (with Mon–Fri / Weekends / Every day shorthands)
function fmtDays(days) {
  if (!Array.isArray(days) || !days.length) return '';
  const sorted = days.slice().sort((a, b) => DP_DAY_ORDER.indexOf(a) - DP_DAY_ORDER.indexOf(b));
  if (sorted.length === 7) return 'Every day';
  const weekdays = DP_DAY_ORDER.slice(0, 5);
  if (sorted.length === 5 && weekdays.every(d => sorted.indexOf(d) >= 0)) return 'Mon–Fri';
  if (sorted.length === 2 && sorted.indexOf('Saturday') >= 0 && sorted.indexOf('Sunday') >= 0) return 'Weekends';
  return sorted.map(d => DP_DAY_SHORT[d] || d).join(', ');
}

// dpPorters -> multi-line "Porter 1 — Mon–Fri · 8 AM–4 PM" (one line per porter)
function fmtPorterSchedule(porters) {
  if (!Array.isArray(porters) || !porters.length) return '';
  return porters.map((p, i) => {
    if (!p || typeof p !== 'object') return '';
    const label = 'Porter ' + (p.id || (i + 1));
    if (p.hoursMode === 'custom' && p.customHours && typeof p.customHours === 'object') {
      const parts = DP_DAY_ORDER.filter(d => p.customHours[d] && p.customHours[d].start && p.customHours[d].end)
        .map(d => DP_DAY_SHORT[d] + ' ' + fmtTime12(p.customHours[d].start) + '–' + fmtTime12(p.customHours[d].end));
      const body = parts.length ? parts.join(', ') : fmtDays(p.days);
      return label + ' — ' + body;
    }
    const days = fmtDays(p.days);
    const hours = (p.sameStart && p.sameEnd) ? (fmtTime12(p.sameStart) + '–' + fmtTime12(p.sameEnd)) : '';
    const body = [days, hours].filter(Boolean).join(' · ');
    return label + (body ? ' — ' + body : '');
  }).filter(Boolean).join('\n');
}

// porterHours -> "Porter 1: 8 AM–4 PM" per entry (legacy flat; suppressed when porter_schedule exists)
function fmtPorterHours(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return arr.map((p, i) => (p && p.start && p.end) ? ('Porter ' + (i + 1) + ': ' + fmtTime12(p.start) + '–' + fmtTime12(p.end)) : '')
    .filter(Boolean).join('\n');
}

// custom_hours -> "Mon 9 AM–1 PM, Wed 9 AM–1 PM" (latent legacy key: object of day->{start,end})
function fmtCustomHours(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return formatGeneric(obj);
  const parts = DP_DAY_ORDER.filter(d => obj[d] && obj[d].start && obj[d].end)
    .map(d => DP_DAY_SHORT[d] + ' ' + fmtTime12(obj[d].start) + '–' + fmtTime12(obj[d].end));
  return parts.length ? parts.join(', ') : formatGeneric(obj);
}

// "8500" / "8,500 sq ft" -> "8,500 sq ft"
function fmtSqft(raw) {
  const n = parseInt(String(raw == null ? '' : raw).replace(/[^\d]/g, ''), 10);
  return (!isNaN(n) && n > 0) ? n.toLocaleString('en-US') + ' sq ft' : formatGeneric(raw);
}

// "09:00-16:00" -> "9 AM–4 PM"
function fmtHourRange(raw) {
  const p = String(raw == null ? '' : raw).split('-');
  return p.length === 2 ? (fmtTime12(p[0].trim()) + '–' + fmtTime12(p[1].trim())) : formatGeneric(raw);
}

// Machine code -> human label, reused from the wizard's own vocabularies.
const LEAD_SIZE_LABELS = {
  'under1k': 'Under 1,000 sq ft', '1k-3k': '1,000–3,000 sq ft', '3k-6k': '3,000–6,000 sq ft',
  '6k-12k': '6,000–12,000 sq ft', '12k-plus': '12,000+ sq ft', 'visit_required': 'In-person visit',
  'notsure': 'In-person visit', 'under3k': 'Under 3,000 sq ft', '6k-9k': '6,000–9,000 sq ft',
  '9k-12k': '9,000–12,000 sq ft', '12k-15k': '12,000–15,000 sq ft'
};
const LEAD_TIME_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible' };
const LEAD_CERTAINTY_LABELS = { guided_via_quiz: 'Guided via quiz', browsed: 'Chose directly' };

// Nice display labels + display order (CSS upper-cases them in the email).
const LEAD_FIELD_ORDER = [
  'space_type', 'space_type_custom', 'space_size', 'exact_sqft', 'cleaning_days', 'time_of_day',
  'porter_schedule', 'coverage_days', 'num_porters', 'porter_count_custom', 'hours_per_day',
  'start_time', 'porter_hours', 'current_situation', 'desired_start', 'service_certainty',
  'needs_site_walk', 'schedule_atypical', 'address', 'suite', 'job_title', 'how_heard', 'notes', 'lead_source'
];
const LEAD_FIELD_LABELS = {
  space_type: 'Space type', space_type_custom: 'Space (other)', space_size: 'Approx. size',
  exact_sqft: 'Exact size', cleaning_days: 'Cleaning days', time_of_day: 'Preferred time',
  porter_schedule: 'Porter schedule', coverage_days: 'Coverage days', num_porters: 'Porters',
  porter_count_custom: 'Porter count', hours_per_day: 'Hours per day', start_time: 'Start time',
  porter_hours: 'Porter hours', custom_hours: 'Custom hours', current_situation: 'Current situation', desired_start: 'Desired start',
  service_certainty: 'How they chose', needs_site_walk: 'Needs site walk', schedule_atypical: 'Atypical schedule',
  address: 'Address', suite: 'Suite / floor', job_title: 'Job title', how_heard: 'How they heard',
  notes: 'Notes', lead_source: 'Lead source'
};
// Shown in the email header/pills already — don't repeat in the table.
const LEAD_HIDDEN_KEYS = ['first_name', 'last_name', 'email', 'phone', 'company', 'form_type', 'urgency'];

function humanizeToken(s) {
  return String(s).replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Generic fallback — turns ANY value (string, number, bool, array, nested
// object, array-of-objects) into readable text. NEVER yields "[object Object]".
function formatGeneric(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(formatGeneric).filter(s => s !== '').join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') {
    return Object.entries(v)
      .filter(([, x]) => x != null && x !== '')
      .map(([k, x]) => humanizeToken(k) + ': ' + formatGeneric(x))
      .join('; ');
  }
  return String(v);
}

function formatLeadValue(key, value) {
  const arr = Array.isArray(value) ? value : [value];
  switch (key) {
    case 'porter_schedule': return fmtPorterSchedule(value);
    case 'porter_hours': return fmtPorterHours(value);
    case 'custom_hours': return fmtCustomHours(value);
    case 'num_porters': return value === 'notsure' ? 'Not sure yet' : formatGeneric(value);
    case 'space_size': return LEAD_SIZE_LABELS[value] || formatGeneric(value);
    case 'exact_sqft': return fmtSqft(value);
    case 'hours_per_day': return fmtHourRange(value);
    case 'start_time': return fmtTime12(value);
    case 'time_of_day': return arr.map(v => LEAD_TIME_LABELS[v] || humanizeToken(v)).join(', ');
    case 'cleaning_days':
    case 'coverage_days': return fmtDays(arr) || arr.join(', ');
    case 'service_certainty': return LEAD_CERTAINTY_LABELS[value] || humanizeToken(value);
    case 'needs_site_walk':
    case 'schedule_atypical': return (value === true || value === 'true') ? 'Yes' : formatGeneric(value);
    default: return formatGeneric(value);
  }
}

// Build the ordered, fully-formatted [{label, value}] list for the internal
// email. Suppresses fields already shown elsewhere and legacy porter fields
// made redundant by the rich porter_schedule. Exported for tests.
export function formatLeadFields(formData) {
  const data = formData || {};
  const hasSchedule = Array.isArray(data.porter_schedule) && data.porter_schedule.length > 0;
  const REDUNDANT_WHEN_SCHEDULE = ['porter_hours', 'hours_per_day', 'start_time'];
  const out = [];
  const seen = new Set();
  const consider = (key) => {
    if (seen.has(key)) return;
    seen.add(key);
    if (LEAD_HIDDEN_KEYS.indexOf(key) >= 0) return;
    if (hasSchedule && REDUNDANT_WHEN_SCHEDULE.indexOf(key) >= 0) return;
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    const raw = data[key];
    if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) return;
    const value = formatLeadValue(key, raw);
    if (!value) return;
    out.push({ label: LEAD_FIELD_LABELS[key] || humanizeToken(key), value });
  };
  LEAD_FIELD_ORDER.forEach(consider);
  Object.keys(data).forEach(consider); // any keys not in the curated order, appended
  return out;
}

// Internal lead notification (approved 2026-07-10). Renders every submitted
// field directly in HTML so nothing drops out (the old Postmark template failed
// to draw the fields array). Returns { subject, html, text }.
export function buildOwnerEmail({ firstName, lastName, email, phone, company, serviceLabel, refNumber, urgencyLabel, fields }) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'New lead';
  const isRush = /asap/i.test(String(urgencyLabel || ''));
  const phoneDigits = String(phone || '').replace(/[^\d+]/g, '');
  const urgencyPillStyle = isRush
    ? 'background:#F7E0D6;color:#993C1D;'
    : 'background:#EAF3DE;color:#3B6D11;';

  const rows = (fields || []).map(f => `
              <tr>
                <td style="padding:11px 16px 11px 0;border-top:1px solid #EEEAE0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#8A8F79;vertical-align:top;white-space:nowrap;">${escapeHtml(f.label)}</td>
                <td style="padding:11px 0;border-top:1px solid #EEEAE0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#23261F;vertical-align:top;">${escapeHtml(f.value).replace(/\n/g, '<br>')}</td>
              </tr>`).join('');

  const callBtn = phoneDigits
    ? `<a href="tel:${phoneDigits}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;padding:10px 16px;border-radius:8px;background:#F1F5EA;color:#3B6D11;border:1px solid #DDE4CF;margin:0 8px 8px 0;">Call ${escapeHtml(phone)}</a>`
    : '';

  const orgLine = company
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5B6B4A;margin-top:3px;">${escapeHtml(company)}</div>`
    : '';

  const subject = `${isRush ? '[RUSH] ' : ''}New quote lead — ${fullName} · ${serviceLabel} · ${refNumber}`;

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#EAE7DE;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EAE7DE;">
  <tr><td align="center" style="padding:26px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#FFFFFF;border:1px solid #E7E4DB;border-radius:12px;overflow:hidden;">
      <tr><td style="text-align:center;padding:20px 24px 16px;background:#FBFAF5;border-bottom:1px solid #EEEADF;">
        <img src="${EMAIL_LOGO_DARK}" alt="Ecco Facilities" width="150" style="width:150px;max-width:150px;height:auto;border:0;display:inline-block;">
      </td></tr>
      <tr><td style="padding:28px 36px 8px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5B6B4A;margin-bottom:8px;">New quote lead</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#14150F;font-weight:bold;">${escapeHtml(fullName)}</div>
        ${orgLine}
        <div style="margin-top:16px;">
          <span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:20px;background:#10210B;color:#EAF5DC;margin:0 8px 8px 0;">${escapeHtml(serviceLabel)}</span>
          <span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:20px;${urgencyPillStyle}margin:0 8px 8px 0;">${escapeHtml(urgencyLabel)}</span>
        </div>
        <div style="margin-top:8px;">
          <a href="mailto:${escapeHtml(email)}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;padding:10px 16px;border-radius:8px;background:#10210B;color:#EAF5DC;margin:0 8px 8px 0;">Reply to ${escapeHtml(firstName || 'lead')}</a>
          ${callBtn}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
          <tr>
            <td style="padding:11px 16px 11px 0;border-top:1px solid #EEEAE0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#8A8F79;vertical-align:top;white-space:nowrap;">Email</td>
            <td style="padding:11px 0;border-top:1px solid #EEEAE0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#23261F;vertical-align:top;"><a href="mailto:${escapeHtml(email)}" style="color:#3B6D11;text-decoration:none;">${escapeHtml(email)}</a></td>
          </tr>${phone ? `
          <tr>
            <td style="padding:11px 16px 11px 0;border-top:1px solid #EEEAE0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#8A8F79;vertical-align:top;white-space:nowrap;">Phone</td>
            <td style="padding:11px 0;border-top:1px solid #EEEAE0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#23261F;vertical-align:top;">${escapeHtml(phone)}</td>
          </tr>` : ''}${rows}
        </table>
      </td></tr>
      <tr><td style="padding:18px 36px 24px;background:#FBFAF5;border-top:1px solid #EEEADF;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9AA08F;">Reference ${escapeHtml(refNumber)} &middot; also saved to the CRM</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const textLines = (fields || []).map(f => `  ${f.label}: ${String(f.value).replace(/\n/g, '\n     ')}`).join('\n');
  const text = `NEW QUOTE LEAD${isRush ? ' [RUSH]' : ''}

${fullName}${company ? '\n' + company : ''}

Service: ${serviceLabel}
Timing: ${urgencyLabel}
Email: ${email}${phone ? '\nPhone: ' + phone : ''}

${textLines}

Reference ${refNumber} · also saved to the CRM`;

  return { subject, html, text };
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin');
  const env = context.env;
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': resolveCors(origin, env),
    'Vary': 'Origin'
  };

  // Ola 7 — defense-in-depth: although Cloudflare routes onRequestPost to
  // POST-only, a misconfigured route / wrangler dev / proxy could still
  // surface other methods. Reject them explicitly so no accidental GET
  // leaks server state. Same idea for the content-type check: any client
  // sending text/plain with JSON-shaped bytes shouldn't sneak through.
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Allow': 'POST' }
    });
  }
  const contentType = context.request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return new Response(JSON.stringify({ ok: false, error: 'Content-Type must be application/json' }), {
      status: 415, headers: corsHeaders
    });
  }
  // Ola 7 — body size cap. CF default is 100MB but our payload is at most
  // a few KB; a larger body is either abuse or a misconfigured client and
  // shouldn't be stored. `content-length` is advisory (a malicious client
  // may lie), but rejecting declared >50KB short-circuits 99% of abuse.
  const contentLength = parseInt(context.request.headers.get('Content-Length') || '0', 10);
  if (contentLength > 50000) {
    return new Response(JSON.stringify({ ok: false, error: 'Request body too large' }), {
      status: 413, headers: corsHeaders
    });
  }

  // AYS Ola 3 #7 — rate limit before parsing body
  const rl = await enforceRateLimit(context.request, env);
  if (!rl.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Retry-After': String(rl.retryAfter || 3600) }
    });
  }

  try {
    let body;
    try { body = await context.request.json(); }
    catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: corsHeaders }); }

    const { turnstileToken, formType } = body;
    // FIX 2026-06-24 (M6/M7): coerce + cap the identity fields at bind time.
    // The old destructure bound em/fn/ln/ph/co RAW — before the MAX_STR cap loop
    // below — so they bypassed the 500-char cap and could even arrive as a
    // non-string (array/object), landing in the CRM/email as-is. __cap forces a
    // capped string for every downstream consumer.
    const __cap = (v) => (v == null ? '' : String(v)).slice(0, 500);
    const email = __cap(body.em), firstName = __cap(body.fn), lastName = __cap(body.ln),
          phone = __cap(body.ph), company = __cap(body.co);

    // FIX 2026-06-24 (H8): honeypot. #qfHpUrl is invisible to real users
    // (sr-only / aria-hidden / tabindex=-1 / autocomplete=off); only naive bots
    // fill it. Fake a success so the bot believes it worked and stops retrying,
    // without touching the CRM, email, or notification path.
    if (body.hp && String(body.hp).trim()) {
      return new Response(JSON.stringify({ ok: true, ref: 'ECJ-OK' }), { status: 200, headers: corsHeaders });
    }

    // AYS Ola 3 #6 — strict email validation (regex hoisted to module scope)
    const MAX_STR = 500;
    if (!email || !EMAIL_RE.test(String(email))) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 400, headers: corsHeaders });
    }
    if (!firstName || !String(firstName).trim()) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing first name' }), { status: 400, headers: corsHeaders });
    }

    // AYS Ola 3 #26 — formType whitelist. Unknown values (client tampering,
    // bot probing) rejected instead of silently defaulting to janitorial.
    if (formType && !ALLOWED_FORM_TYPES.has(String(formType))) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid form type' }), { status: 400, headers: corsHeaders });
    }
    // Whitelist + coerce: drop any key not in KEY_MAP, cap each string to MAX_STR.
    // V2 2026-04-24 — added timeOfDay, serviceCertainty, needsSiteWalk, scheduleAtypical.
    // D55 2026-04-26 — added dpPorters (rich per-porter schedule array, max 6 entries).
    const ALLOWED_KEYS = new Set([
      'em','fn','ln','ph','co','pos','addr','suite','referral','notes','contactPref','formType',
      'space','spaceOther','urg','size','exactSize','janDays',
      'hrs','customHrs','startTime','porterHours','dpDays','dpPorters','porters','porterCount','dpAreas','areaOther',
      'timeOfDay','serviceCertainty','needsSiteWalk','scheduleAtypical',
      // 2026-06-20 — modernization signals: situation + timeline chips, lead source.
      'situation','timeline','source',
      'turnstileToken'
    ]);
    for (const k of Object.keys(body)) {
      if (!ALLOWED_KEYS.has(k)) { delete body[k]; continue; }
      const v = body[k];
      if (typeof v === 'string' && v.length > MAX_STR) body[k] = v.slice(0, MAX_STR);
      if (Array.isArray(v)) body[k] = v.slice(0, 20).map((s) => typeof s === 'string' ? s.slice(0, MAX_STR) : s);
    }
    // D55 2026-04-26 — dpPorters: array of porter-objects. Cap to 6 (matches
    // frontend MAX_PORTERS) and shape-validate each entry. Anything malformed
    // is dropped silently — frontend enforces the schema; this is defense-in-depth.
    if (Array.isArray(body.dpPorters)) {
      const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
      const VALID_DAYS = new Set(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']);
      body.dpPorters = body.dpPorters.slice(0, 6).map((p, i) => {
        if (!p || typeof p !== 'object') return null;
        const days = Array.isArray(p.days) ? p.days.filter((d) => VALID_DAYS.has(d)).slice(0, 7) : [];
        const hoursMode = p.hoursMode === 'custom' ? 'custom' : 'same';
        const sameStart = (typeof p.sameStart === 'string' && TIME_RE.test(p.sameStart)) ? p.sameStart : '';
        const sameEnd = (typeof p.sameEnd === 'string' && TIME_RE.test(p.sameEnd)) ? p.sameEnd : '';
        const out = { id: Number(p.id) || (i + 1), days, hoursMode, sameStart, sameEnd };
        if (hoursMode === 'custom' && p.customHours && typeof p.customHours === 'object') {
          out.customHours = {};
          for (const day of Object.keys(p.customHours)) {
            if (!VALID_DAYS.has(day)) continue;
            const ch = p.customHours[day];
            if (ch && typeof ch === 'object' &&
                typeof ch.start === 'string' && TIME_RE.test(ch.start) &&
                typeof ch.end === 'string' && TIME_RE.test(ch.end)) {
              out.customHours[day] = { start: ch.start, end: ch.end };
            }
          }
        }
        return out;
      }).filter(Boolean);
    }
    // V2 2026-04-24 — pos validation: trim + max 80 chars (free-text role field).
    if (typeof body.pos === 'string') {
      body.pos = body.pos.trim().slice(0, 80);
      if (body.pos.length < 2) delete body.pos;
    }
    // V2 2026-04-24 — coerce booleans for new flag fields (frontend sends true/false; backend stores boolean).
    if (body.needsSiteWalk !== undefined) body.needsSiteWalk = !!body.needsSiteWalk;
    if (body.scheduleAtypical !== undefined) body.scheduleAtypical = !!body.scheduleAtypical;
    // V2 2026-04-24 — serviceCertainty: only allow specific enum values.
    if (body.serviceCertainty && body.serviceCertainty !== 'guided_via_quiz') {
      delete body.serviceCertainty;
    }
    // 2026-06-20 — situation + timeline enums (frontend chip groups). Drop any
    // off-list value; defense-in-depth, frontend already constrains these.
    if (body.situation && body.situation !== 'new' && body.situation !== 'switching') {
      delete body.situation;
    }
    const TIMELINE_VALUES = new Set(['asap', 'weeks', 'exploring']);
    if (body.timeline && !TIMELINE_VALUES.has(body.timeline)) {
      delete body.timeline;
    }
    // 2026-06-20 — source attribution object: keep only known string fields,
    // each trimmed + capped. Drop the whole key if malformed or empty.
    if (body.source && typeof body.source === 'object' && !Array.isArray(body.source)) {
      const SRC_FIELDS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','referrer','landing'];
      const cleanSrc = {};
      for (const f of SRC_FIELDS) {
        const sv = body.source[f];
        if (typeof sv === 'string' && sv.trim()) cleanSrc[f] = sv.trim().slice(0, 300);
      }
      if (Object.keys(cleanSrc).length) body.source = cleanSrc; else delete body.source;
    } else if (body.source !== undefined) {
      delete body.source;
    }

    // AYS Ola 3 #4 — Turnstile fail-loud. Production MUST set CF_TURNSTILE_SECRET.
    // If it's missing, the previous code silently skipped captcha validation —
    // every submission accepted, bots sail through. Now we 503 until configured,
    // except on localhost where the dev loop expects to work without Turnstile.
    // AYS Ola 3 Commit G #37 — parse hostname so any dev port is treated as local.
    // AYS Ola 4 Commit K CR-3 — defense in depth: an attacker could spoof the
    // Origin header to `http://localhost:3000` from a remote IP and bypass
    // Turnstile. Cross-check CF-Connecting-IP against loopback to confirm
    // the request actually comes from the dev machine.
    const turnstileSecret = env.CF_TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY;
    let isLocal = false;
    try {
      const host = origin ? new URL(origin).hostname : '';
      const originLooksLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
      const cfIp = context.request.headers.get('CF-Connecting-IP') || '';
      // CF edge doesn't inject CF-Connecting-IP for same-machine dev (wrangler),
      // so empty IP + local-looking origin is accepted. Otherwise the IP must
      // match loopback, not a remote IP spoofing a local Origin header.
      const ipLooksLocal = !cfIp || cfIp === '127.0.0.1' || cfIp === '::1';
      isLocal = originLooksLocal && ipLooksLocal;
    } catch (_) { isLocal = false; }
    if (!turnstileSecret && !isLocal) {
      console.error('[submit-quote] CF_TURNSTILE_SECRET missing in production env');
      return new Response(JSON.stringify({ ok: false, error: 'Captcha not configured. Please contact support.' }), { status: 503, headers: corsHeaders });
    }
    if (turnstileSecret) {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ ok: false, error: 'Captcha required' }), { status: 403, headers: corsHeaders });
      }
      try {
        const verifyRes = await fetchWithTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken,
            remoteip: context.request.headers.get('CF-Connecting-IP') || ''
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return new Response(JSON.stringify({ ok: false, error: 'Captcha verification failed' }), { status: 403, headers: corsHeaders });
        }
      } catch (verifyErr) {
        console.error('[submit-quote] Turnstile verify error:', redactPII(verifyErr.message));
        return new Response(JSON.stringify({ ok: false, error: 'Captcha service unavailable' }), { status: 503, headers: corsHeaders });
      }
    }

    // 2. Generate reference number
    const prefix = formType === 'dayporter' ? 'EDP-' : 'ECJ-';
    // Ola 7 — switched to a UUID-derived tail. `Date.now().toString(36)` +
    // 3 random bytes had a theoretical collision window (same-millisecond
    // submits with correlated entropy from shared seeds). crypto.randomUUID
    // gives 122 bits of entropy; we slice 12 hex chars (48 bits) into the
    // tail — still enumeration-resistant, still short enough for the user
    // to copy from an email, and mathematically collision-free at our scale.
    const uuid = (crypto.randomUUID && crypto.randomUUID()) ||
                 Array.from(crypto.getRandomValues(new Uint8Array(8)))
                   .map(b => b.toString(16).padStart(2, '0')).join('');
    const refTail = uuid.replace(/-/g, '').slice(0, 12).toUpperCase();
    const refNumber = prefix + refTail;

    // 3. Build form_data with readable labels
    const KEY_MAP = {
      fn: 'first_name', ln: 'last_name', em: 'email', ph: 'phone',
      co: 'company', pos: 'job_title', addr: 'address', suite: 'suite', referral: 'how_heard', notes: 'notes',
      contactPref: 'contact_preference', formType: 'form_type',
      // Shared
      space: 'space_type', spaceOther: 'space_type_custom', urg: 'urgency',
      // Janitorial
      size: 'space_size', exactSize: 'exact_sqft',
      janDays: 'cleaning_days',
      // Day Porter
      hrs: 'hours_per_day', customHrs: 'custom_hours',
      startTime: 'start_time', dpDays: 'coverage_days',
      porterHours: 'porter_hours',
      // D55 — dpPorters = array of per-porter objects. Persisted as JSON to
      // D1/HubSpot/Supabase; formatted human-readable for the lead email by
      // formatLeadFields/fmtPorterSchedule (2026-07-10).
      dpPorters: 'porter_schedule',
      porters: 'num_porters', porterCount: 'porter_count_custom',
      dpAreas: 'areas_covered', areaOther: 'area_custom',
      // V2 2026-04-24 — new keys
      timeOfDay: 'time_of_day',
      serviceCertainty: 'service_certainty',
      needsSiteWalk: 'needs_site_walk',
      scheduleAtypical: 'schedule_atypical',
      // 2026-06-20 — modernization signals
      situation: 'current_situation',
      timeline: 'desired_start',
      source: 'lead_source',
    };
    const URGENCY_MAP = {
      asap: 'ASAP', '1-2w': '1–2 weeks', '1m': '1 month', flex: 'Flexible', unsure: 'Not sure'
    };
    // 2026-06-20 — human-readable labels for the situation + timeline chips.
    const SITUATION_MAP = { new: 'New (no cleaner today)', switching: 'Switching providers' };
    const TIMELINE_MAP = { asap: 'As soon as possible', weeks: 'Within a few weeks', exploring: 'Just exploring' };
    const formData = {};
    for (const [k, v] of Object.entries(body)) {
      if (k.startsWith('_') || k === 'turnstileToken') continue;
      const label = KEY_MAP[k] || k;
      let value = v;
      if (k === 'urg' && URGENCY_MAP[v]) value = URGENCY_MAP[v];
      else if (k === 'situation' && SITUATION_MAP[v]) value = SITUATION_MAP[v];
      else if (k === 'timeline' && TIMELINE_MAP[v]) value = TIMELINE_MAP[v];
      else if (k === 'source' && v && typeof v === 'object') {
        // Flatten the attribution object into a compact "key=value · key=value"
        // string so it renders cleanly in the lead email + CRM text field.
        value = Object.entries(v).map(([sk, sv]) => sk + '=' + sv).join(' · ');
      }
      formData[label] = value;
    }

    const service = formType === 'dayporter' ? 'dayporter' : 'janitorial';

    // AYS Ola 2 #8 — track integration success so a total-failure (network blip,
    // all services down) returns 502 to the client instead of a false-positive
    // success. The user sees an error toast and can retry or email directly.
    // AYS Ola 4 Commit N ME-8 — split Postmark into client (user confirm) and
    // owner (internal notification) tracks. Client still affects the
    // user-facing "success" decision; owner failures are logged loudly but
    // don't block the user — the CRM write is the source of truth for ops.
    const integrations = { supabase: null, d1: null, activecampaign: null, hubspot: null, postmark: null, postmark_owner: null, webhook: null };
    const anyConfigured = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY)
      || !!env.DB
      || !!(env.ACTIVECAMPAIGN_API_URL && env.ACTIVECAMPAIGN_API_KEY)
      || !!env.HUBSPOT_ACCESS_TOKEN
      || !!env.POSTMARK_API_KEY;

    // 4. UPSERT into Supabase (via REST API — no npm package needed)
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      integrations.supabase = false;
      try {
        // Supabase REST requires BOTH apikey (project) and Authorization:Bearer
        // (session token) headers — this is not duplicate auth, it's their
        // documented pattern for service-role writes. DO NOT remove either.
        const sbRes = await fetchWithTimeout(`${env.SUPABASE_URL}/rest/v1/leads?on_conflict=email,service`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            email,
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
            company: company || null,
            service,
            status: 'completed',
            form_data: formData,
            ref_number: refNumber,
            completed_at: new Date().toISOString()
          })
        });
        if (sbRes.ok) {
          integrations.supabase = true;
        } else {
          // AYS Ola 3 Commit G #34 — Supabase echoes the offending row on validation
          // errors, so errText can contain user email/phone. Redact before logging.
          const errText = await sbRes.text();
          console.error('[submit-quote] Supabase error:', sbRes.status, redactPII(errText));
        }
      } catch (dbErr) {
        console.error('[submit-quote] Supabase DB error:', redactPII(dbErr.message));
      }
    }

    // 4b. Cloudflare D1 — native, no-pause leads store (2026-06-24, recommended
    // primary DB). Activates automatically once a D1 database is bound as `DB`
    // in the Pages project. Mirrors the Supabase schema; apply schema/leads.sql
    // once with: wrangler d1 execute ecco-leads --file=schema/leads.sql
    if (env.DB) {
      integrations.d1 = false;
      try {
        await env.DB.prepare(
          'INSERT INTO leads (ref_number, email, first_name, last_name, phone, company, service, status, form_data, completed_at) ' +
          'VALUES (?,?,?,?,?,?,?,?,?,?) ' +
          'ON CONFLICT(email, service) DO UPDATE SET ' +
          'first_name=excluded.first_name, last_name=excluded.last_name, phone=excluded.phone, ' +
          'company=excluded.company, status=excluded.status, form_data=excluded.form_data, ' +
          'ref_number=excluded.ref_number, completed_at=excluded.completed_at'
        ).bind(
          refNumber, email, firstName || null, lastName || null, phone || null,
          company || null, service, 'completed', JSON.stringify(formData), new Date().toISOString()
        ).run();
        integrations.d1 = true;
      } catch (d1Err) {
        console.error('[submit-quote] D1 error:', redactPII(d1Err.message));
      }
    }

    // 5. ActiveCampaign: sync contact + add "completed" tag
    if (env.ACTIVECAMPAIGN_API_URL && env.ACTIVECAMPAIGN_API_KEY) {
      integrations.activecampaign = false;
      try {
        const acHeaders = { 'Api-Token': env.ACTIVECAMPAIGN_API_KEY, 'Content-Type': 'application/json' };

        const syncRes = await fetchWithTimeout(`${env.ACTIVECAMPAIGN_API_URL}/api/3/contact/sync`, {
          method: 'POST', headers: acHeaders,
          body: JSON.stringify({ contact: { email, firstName: firstName || '', lastName: lastName || '', phone: phone || '' } })
        });
        const syncData = await syncRes.json();
        const contactId = syncData?.contact?.id;

        if (contactId) {
          const tagsRes = await fetchWithTimeout(`${env.ACTIVECAMPAIGN_API_URL}/api/3/tags?search=completed`, { headers: acHeaders });
          const tagsData = await tagsRes.json();
          let tagId = tagsData?.tags?.find(t => t.tag === 'completed')?.id;

          if (!tagId) {
            const createTagRes = await fetchWithTimeout(`${env.ACTIVECAMPAIGN_API_URL}/api/3/tags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ tag: { tag: 'completed', tagType: 'contact' } })
            });
            tagId = (await createTagRes.json())?.tag?.id;
          }

          if (tagId) {
            await fetchWithTimeout(`${env.ACTIVECAMPAIGN_API_URL}/api/3/contactTags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
            });
          }
          integrations.activecampaign = true;
        }
      } catch (e) {
        console.error('[submit-quote] ActiveCampaign error:', redactPII(e.message));
      }
    }

    // 6. HubSpot: create/update contact + create deal
    if (env.HUBSPOT_ACCESS_TOKEN) {
      integrations.hubspot = false;
      try {
        const hsHeaders = {
          'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        };

        // Search for existing contact by email
        const searchRes = await fetchWithTimeout('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST', headers: hsHeaders,
          body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }]
          })
        });
        const searchData = await searchRes.json();
        let hsContactId = searchData?.results?.[0]?.id;

        const contactProps = {
          email,
          firstname: firstName || '',
          lastname: lastName || '',
          phone: phone || '',
          company: company || '',
          ecco_service_type: service,
          ecco_ref_number: refNumber,
          ecco_space_type: formData.space_type || '',
          ecco_urgency: formData.urgency || '',
          ecco_lead_status: 'completed',
          ecco_form_data: safeStringify(formData)
        };

        if (hsContactId) {
          await fetchWithTimeout(`https://api.hubapi.com/crm/v3/objects/contacts/${hsContactId}`, {
            method: 'PATCH', headers: hsHeaders,
            body: JSON.stringify({ properties: contactProps })
          });
        } else {
          const createRes = await fetchWithTimeout('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST', headers: hsHeaders,
            body: JSON.stringify({ properties: contactProps })
          });
          const createData = await createRes.json();
          hsContactId = createData?.id;
        }

        // Create a deal for pipeline tracking
        if (hsContactId) {
          const dealName = `${company || firstName} - ${service === 'dayporter' ? 'Day Porter' : 'Janitorial'} (${refNumber})`;
          const dealRes = await fetchWithTimeout('https://api.hubapi.com/crm/v3/objects/deals', {
            method: 'POST', headers: hsHeaders,
            body: JSON.stringify({
              properties: {
                dealname: dealName,
                dealstage: '3441379002',
                pipeline: 'default'
              }
            })
          });
          const dealData = await dealRes.json();
          const dealId = dealData?.id;

          if (dealId) {
            await fetchWithTimeout(
              `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts/${hsContactId}/deal_to_contact/3`,
              { method: 'PUT', headers: hsHeaders }
            );
          }
          integrations.hubspot = true;
        }
      } catch (e) {
        console.error('[submit-quote] HubSpot error:', redactPII(e.message));
      }
    }

    // 7. Postmark: confirmation email to client + notification to owner.
    // 2026-07-10 — moved OFF Postmark templates onto raw /email so the subject
    // and HTML are versioned here and fully in our control (templates rendered
    // the subject + owner fields array unreliably). Still sent via Postmark, so
    // deliverability is unchanged. HTML built by buildClientEmail/buildOwnerEmail.
    if (env.POSTMARK_API_KEY) {
      const serviceLabel = formType === 'dayporter' ? 'Day Porter'
        : formType === 'both' ? 'Commercial Cleaning & Day Porter'
        : 'Commercial Cleaning';
      const pmHeaders = {
        'X-Postmark-Server-Token': env.POSTMARK_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Client confirmation
      integrations.postmark = false;
      try {
        const msg = buildClientEmail({ firstName, refNumber, serviceLabel });
        const pmRes = await fetchWithTimeout('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: pmHeaders,
          body: JSON.stringify({
            From: 'Ecco Facilities <info@eccofacilities.com>',
            To: email,
            ReplyTo: 'info@eccofacilities.com',
            Subject: msg.subject,
            HtmlBody: msg.html,
            TextBody: msg.text
          })
        });
        if (pmRes.ok) integrations.postmark = true;
        else {
          // AYS Ola 3 #17 — Postmark non-ok silent. Log the status so Logpush
          // surfaces delivery failures; integrations.postmark stays false and
          // the aggregate-failure check at the bottom catches total outages.
          console.error('[submit-quote] Postmark non-ok status:', pmRes.status);
        }
      } catch (e) {
        console.error('[submit-quote] Postmark client email error:', redactPII(e.message));
      }

      // Owner / team notification
      integrations.postmark_owner = false;
      try {
        const urgencyLabel = formData.urgency || 'Standard';
        // Fully-formatted, ordered field list — porter schedules, coded values,
        // arrays and nested objects all rendered human-readable (no
        // "[object Object]"), nothing lost, so the team needn't open the CRM.
        const fields = formatLeadFields(formData);
        const msg = buildOwnerEmail({
          firstName, lastName, email, phone, company,
          serviceLabel, refNumber, urgencyLabel, fields
        });
        const ownerRes = await fetchWithTimeout('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: pmHeaders,
          body: JSON.stringify({
            From: 'Ecco Facilities Leads <info@eccofacilities.com>',
            To: 'info@eccofacilities.com',
            ReplyTo: email,
            Subject: msg.subject,
            HtmlBody: msg.html,
            TextBody: msg.text
          })
        });
        if (ownerRes.ok) {
          integrations.postmark_owner = true;
        } else {
          // AYS Ola 4 Commit N ME-8 — loud structured log so ops can alert on it.
          console.error('[submit-quote] Postmark owner email non-ok:', {
            status: ownerRes.status,
            refNumber
          });
        }
      } catch (e) {
        console.error('[submit-quote] Postmark owner email error:', {
          message: redactPII(e.message),
          refNumber
        });
      }
    }

    // Instant lead alert (2026-06-24) — POST a compact summary to a generic
    // webhook so the team is pinged the moment a lead lands. Works with
    // Slack/Discord incoming webhooks (text/content) and Zapier/Make catch-hooks
    // (the structured fields). Activates once LEAD_WEBHOOK_URL is set.
    if (env.LEAD_WEBHOOK_URL) {
      integrations.webhook = false;
      try {
        const who = [firstName, lastName].filter(Boolean).join(' ') || 'New lead';
        const summary = 'New quote lead — ' + who + ' · ' + (company || 'no company') +
          ' · ' + service + ' · ' + email + (phone ? ' · ' + phone : '') + ' · ref ' + refNumber;
        const wRes = await fetchWithTimeout(env.LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: summary, content: summary, ref: refNumber, name: who, email, phone: phone || '', company: company || '', service })
        });
        if (wRes.ok) integrations.webhook = true;
        else console.error('[submit-quote] lead webhook non-ok:', wRes.status, refNumber);
      } catch (wErr) {
        console.error('[submit-quote] lead webhook error:', redactPII(wErr.message));
      }
    }

    // AYS Ola 2 #8 — if integrations were configured but NONE succeeded, we lost
    // the lead. Fail loudly so the user can retry instead of seeing confetti
    // while the submission evaporated. When none are configured (local dev),
    // skip the check and return ok — matches the "guest mode" behaviour.
    const configuredOnes = Object.entries(integrations).filter(([, v]) => v !== null);
    const anySucceeded = configuredOnes.some(([, v]) => v === true);
    if (anyConfigured && configuredOnes.length > 0 && !anySucceeded) {
      console.error('[submit-quote] All integrations failed', integrations);
      return new Response(JSON.stringify({ ok: false, error: 'Lead services unavailable, please try again or email info@eccofacilities.com.' }), { status: 502, headers: corsHeaders });
    }

    // AYS Ola 4 Commit N ME-10 — structured JSON-line observability log. One
    // line per successful submit so Logpush / Analytics Engine / external
    // aggregators can parse without regex. No PII in this line: ref, service,
    // formType, per-integration outcome, hashed IP for dedupe analytics.
    // Hash rather than raw IP to stay GDPR-friendly.
    const obsIpHash = await (async () => {
      const rawIp = context.request.headers.get('CF-Connecting-IP') || '';
      if (!rawIp || typeof crypto.subtle?.digest !== 'function') return 'na';
      const data = new TextEncoder().encode(rawIp);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).slice(0, 6).map(b => b.toString(16).padStart(2,'0')).join('');
    })();
    console.log(JSON.stringify({
      evt: 'submit_quote_ok',
      ref: refNumber,
      service,
      formType: formType || 'janitorial',
      integrations,
      ipHash: obsIpHash,
      ts: Date.now()
    }));

    return new Response(JSON.stringify({ ok: true, ref: refNumber }), { status: 200, headers: corsHeaders });

  } catch (err) {
    // AYS Ola 3 #18 — redact PII and strip stack (prevents path/logic leaks
    // into external log destinations). Full stack available at Cloudflare's
    // native error panel for debugging.
    console.error('[submit-quote] Fatal error:', redactPII(err.message));
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers: corsHeaders });
  }
}
