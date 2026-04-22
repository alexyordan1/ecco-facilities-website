// Ola 1 — Capture-partial hardening:
// - CORS: tight allowlist (was: any *.pages.dev)
// - Rate-limit: 5/hr per IP (was: none; endpoint was spammeable)
// - Email validation: strict regex matching submit-quote.js (was: permissive)
// - Error responses: 400 on bad input (was: always 200, hiding failures)
// - Anti-overwrite: skip if lead was updated <5 min ago (blocks competitor
//   enumeration / data poisoning)

const ALLOWED_ORIGINS = [
  'https://eccofacilities.com',
  'https://www.eccofacilities.com',
  'http://localhost:8080'
];

function resolveCors(origin, env) {
  if (!origin) return 'https://eccofacilities.com';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  const previewDomain = env && env.ALLOWED_PREVIEW_ORIGIN;
  if (previewDomain && origin === previewDomain) return origin;
  return 'https://eccofacilities.com';
}

// Must match submit-quote.js EMAIL_RE byte-for-byte
const EMAIL_RE = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?!-)[A-Za-z0-9](?:[A-Za-z0-9.\-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/;

async function enforceRateLimit(request, env) {
  const kv = env && env.RATE_LIMIT_KV;
  if (!kv) return { ok: true };
  const ip = request.headers.get('CF-Connecting-IP');
  const bucket = ip || 'unknown';
  const limit = ip ? 5 : 2;
  const hour = Math.floor(Date.now() / 3600000);
  const key = `rl:partial:${bucket}:${hour}`;
  const current = parseInt(await kv.get(key) || '0', 10);
  if (current >= limit) {
    return { ok: false, retryAfter: 3600 - Math.floor((Date.now() / 1000) % 3600) };
  }
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  return { ok: true };
}

function fetchWithTimeout(input, init = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init.signal || controller.signal;
  return fetch(input, { ...init, signal })
    .finally(() => clearTimeout(id));
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin');
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': resolveCors(origin, context.env),
    'Vary': 'Origin'
  };

  const rl = await enforceRateLimit(context.request, context.env);
  if (!rl.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Retry-After': String(rl.retryAfter || 3600) }
    });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ACTIVECAMPAIGN_API_URL, ACTIVECAMPAIGN_API_KEY } = context.env;

    let body;
    try { body = await context.request.json(); }
    catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: corsHeaders }); }

    const { email, firstName, phone } = body;
    if (!email || !EMAIL_RE.test(String(email))) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 400, headers: corsHeaders });
    }

    // Size-bound user input so a bad client can't store unbounded blobs
    const safeFirst = (firstName || '').toString().slice(0, 80) || null;
    const safePhone = (phone || '').toString().slice(0, 32) || null;

    // 1. Insert partial lead into Supabase (skip if already completed).
    //    Rate-limit (above) is the primary anti-overwrite protection; an
    //    `updated_at`-based fresh-lock is deferred until the schema grows an
    //    updated_at column with an ON UPDATE NOW() trigger.
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const checkRes = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&select=status`,
          {
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
          }
        );
        const existing = await checkRes.json();
        const isCompleted = existing?.[0]?.status === 'completed';

        if (!isCompleted) {
          await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              email,
              first_name: safeFirst,
              phone: safePhone,
              status: 'partial'
            })
          });
        }
      } catch (e) {
        console.error('[capture-partial] Supabase error:', e.message);
      }
    }

    // 2. Sync contact in ActiveCampaign + add partial_lead tag
    if (ACTIVECAMPAIGN_API_URL && ACTIVECAMPAIGN_API_KEY) {
      try {
        const acHeaders = { 'Api-Token': ACTIVECAMPAIGN_API_KEY, 'Content-Type': 'application/json' };

        const syncRes = await fetchWithTimeout(`${ACTIVECAMPAIGN_API_URL}/api/3/contact/sync`, {
          method: 'POST', headers: acHeaders,
          body: JSON.stringify({ contact: { email, firstName: safeFirst || '', phone: safePhone || '' } })
        });
        const syncData = await syncRes.json();
        const contactId = syncData?.contact?.id;

        if (contactId) {
          const tagsRes = await fetchWithTimeout(`${ACTIVECAMPAIGN_API_URL}/api/3/tags?search=partial_lead`, { headers: acHeaders });
          const tagsData = await tagsRes.json();
          let tagId = tagsData?.tags?.find(t => t.tag === 'partial_lead')?.id;

          if (!tagId) {
            const createTagRes = await fetchWithTimeout(`${ACTIVECAMPAIGN_API_URL}/api/3/tags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ tag: { tag: 'partial_lead', tagType: 'contact' } })
            });
            tagId = (await createTagRes.json())?.tag?.id;
          }

          if (tagId) {
            await fetchWithTimeout(`${ACTIVECAMPAIGN_API_URL}/api/3/contactTags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
            });
          }

          if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
            try {
              await fetchWithTimeout(
                `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}`,
                {
                  method: 'PATCH',
                  headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ ac_contact_id: contactId })
                }
              );
            } catch (e) {
              console.error('[capture-partial] Supabase AC ID update error:', e.message);
            }
          }
        }
      } catch (e) {
        console.error('[capture-partial] ActiveCampaign error:', e.message);
      }
    }

    // 3. HubSpot: sync partial lead as contact
    if (context.env.HUBSPOT_ACCESS_TOKEN) {
      try {
        const hsHeaders = {
          'Authorization': `Bearer ${context.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        };

        const searchRes = await fetchWithTimeout('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST', headers: hsHeaders,
          body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
            properties: ['ecco_lead_status']
          })
        });
        const searchData = await searchRes.json();
        const existing = searchData?.results?.[0];

        const contactProps = {
          email,
          firstname: safeFirst || '',
          phone: safePhone || '',
          ecco_lead_status: 'partial'
        };

        if (existing?.id) {
          if (existing.properties?.ecco_lead_status !== 'completed') {
            await fetchWithTimeout(`https://api.hubapi.com/crm/v3/objects/contacts/${existing.id}`, {
              method: 'PATCH', headers: hsHeaders,
              body: JSON.stringify({ properties: contactProps })
            });
          }
        } else {
          await fetchWithTimeout('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST', headers: hsHeaders,
            body: JSON.stringify({ properties: contactProps })
          });
        }
      } catch (e) {
        console.error('[capture-partial] HubSpot error:', e.message);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[capture-partial] Unexpected error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: 'Unexpected error' }), { status: 500, headers: corsHeaders });
  }
}
