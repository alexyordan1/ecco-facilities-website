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
const EMAIL_RE = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?!-)[A-Za-z0-9](?:[A-Za-z0-9.\-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/;

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

    const { em: email, fn: firstName, ln: lastName, ph: phone, co: company,
            turnstileToken, formType } = body;

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
    const ALLOWED_KEYS = new Set([
      'em','fn','ln','ph','co','addr','referral','notes','contactPref','formType',
      'space','spaceOther','urg','size','exactSize','janDays',
      'hrs','customHrs','startTime','porterHours','dpDays','porters','porterCount','dpAreas','areaOther',
      'turnstileToken'
    ]);
    for (const k of Object.keys(body)) {
      if (!ALLOWED_KEYS.has(k)) { delete body[k]; continue; }
      const v = body[k];
      if (typeof v === 'string' && v.length > MAX_STR) body[k] = v.slice(0, MAX_STR);
      if (Array.isArray(v)) body[k] = v.slice(0, 20).map((s) => typeof s === 'string' ? s.slice(0, MAX_STR) : s);
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
      co: 'company', addr: 'address', referral: 'how_heard', notes: 'notes',
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
      porters: 'num_porters', porterCount: 'porter_count_custom',
      dpAreas: 'areas_covered', areaOther: 'area_custom',
    };
    const URGENCY_MAP = {
      asap: 'ASAP', '1-2w': '1–2 weeks', '1m': '1 month', flex: 'Flexible', unsure: 'Not sure'
    };
    const formData = {};
    for (const [k, v] of Object.entries(body)) {
      if (k.startsWith('_') || k === 'turnstileToken') continue;
      const label = KEY_MAP[k] || k;
      let value = v;
      if (k === 'urg' && URGENCY_MAP[v]) value = URGENCY_MAP[v];
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
    const integrations = { supabase: null, activecampaign: null, hubspot: null, postmark: null, postmark_owner: null };
    const anyConfigured = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY)
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

    // 7. Postmark: confirmation email to client
    if (env.POSTMARK_API_KEY) {
      integrations.postmark = false;
      try {
        const pmRes = await fetchWithTimeout('https://api.postmarkapp.com/email/withTemplate', {
          method: 'POST',
          headers: {
            'X-Postmark-Server-Token': env.POSTMARK_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            From: 'info@eccofacilities.com',
            To: email,
            TemplateAlias: 'quote-confirmation',
            TemplateModel: {
              firstName: firstName || 'there',
              refNumber,
              service: service === 'dayporter' ? 'Day Porter Services' : 'Janitorial Services'
            }
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

      // 7. Postmark: notification email to owner
      integrations.postmark_owner = false;
      try {
        const ownerRes = await fetchWithTimeout('https://api.postmarkapp.com/email/withTemplate', {
          method: 'POST',
          headers: {
            'X-Postmark-Server-Token': env.POSTMARK_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            From: 'info@eccofacilities.com',
            To: 'info@eccofacilities.com',
            TemplateAlias: 'owner-notification',
            TemplateModel: {
              firstName: firstName || '',
              lastName: lastName || '',
              email,
              phone: phone || 'N/A',
              company: company || 'N/A',
              service: service === 'dayporter' ? 'Day Porter Services' : 'Janitorial Services',
              refNumber,
              urgency: formData.urgency || 'Standard',
              fields: Object.entries(formData)
                .filter(([_, v]) => v != null && v !== '')
                .map(([key, value]) => ({
                  label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                  value: Array.isArray(value) ? value.join(', ') : String(value)
                }))
            }
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

    // AYS Ola 2 #8 — if integrations were configured but NONE succeeded, we lost
    // the lead. Fail loudly so the user can retry instead of seeing confetti
    // while the submission evaporated. When none are configured (local dev),
    // skip the check and return ok — matches the "guest mode" behaviour.
    const configuredOnes = Object.entries(integrations).filter(([, v]) => v !== null);
    const anySucceeded = configuredOnes.some(([, v]) => v === true);
    if (anyConfigured && configuredOnes.length > 0 && !anySucceeded) {
      console.error('[submit-quote] All integrations failed', integrations);
      return new Response(JSON.stringify({ ok: false, error: 'Lead services unavailable — please try again or email info@eccofacilities.com.' }), { status: 502, headers: corsHeaders });
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
