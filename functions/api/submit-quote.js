const ALLOWED_ORIGINS = [
  'https://eccofacilities.com',
  'https://www.eccofacilities.com',
  'http://localhost:8080'
];
function resolveCors(origin) {
  if (!origin) return 'https://eccofacilities.com';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin)) return origin;
  return 'https://eccofacilities.com';
}

export async function onRequestPost(context) {
  const origin = context.request.headers.get('Origin');
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': resolveCors(origin),
    'Vary': 'Origin'
  };

  try {
    const env = context.env;
    let body;
    try { body = await context.request.json(); }
    catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: corsHeaders }); }

    const { em: email, fn: firstName, ln: lastName, ph: phone, co: company,
            turnstileToken, formType } = body;

    // AYS Ola 2 #7+#10 — strict field validation + aligned client/server email regex
    const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}$/;
    const MAX_STR = 500;
    if (!email || !EMAIL_RE.test(String(email))) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 400, headers: corsHeaders });
    }
    if (!firstName || !String(firstName).trim()) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing first name' }), { status: 400, headers: corsHeaders });
    }
    // Whitelist + coerce: drop any key not in KEY_MAP, cap each string to MAX_STR.
    const ALLOWED_KEYS = new Set([
      'em','fn','ln','ph','co','addr','referral','notes','contactPref','formType',
      'space','spaceOther','urg','size','exactSize','janDays','addDayPorter','window',
      'hrs','customHrs','startTime','dpDays','porters','porterCount','dpAreas','areaOther','addJanitorial',
      'turnstileToken'
    ]);
    for (const k of Object.keys(body)) {
      if (!ALLOWED_KEYS.has(k)) { delete body[k]; continue; }
      const v = body[k];
      if (typeof v === 'string' && v.length > MAX_STR) body[k] = v.slice(0, MAX_STR);
      if (Array.isArray(v)) body[k] = v.slice(0, 20).map((s) => typeof s === 'string' ? s.slice(0, MAX_STR) : s);
    }

    // 1. Validate Turnstile server-side (required in production when secret is set)
    const turnstileSecret = env.CF_TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ ok: false, error: 'Captcha required' }), { status: 403, headers: corsHeaders });
      }
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
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
        console.error('[submit-quote] Turnstile verify error:', verifyErr.message);
        return new Response(JSON.stringify({ ok: false, error: 'Captcha service unavailable' }), { status: 503, headers: corsHeaders });
      }
    }

    // 2. Generate reference number
    const prefix = formType === 'dayporter' ? 'EDP-' : 'ECJ-';
    const refNumber = prefix + Date.now().toString(36).toUpperCase();

    // 3. Build form_data with readable labels
    const KEY_MAP = {
      fn: 'first_name', ln: 'last_name', em: 'email', ph: 'phone',
      co: 'company', addr: 'address', referral: 'how_heard', notes: 'notes',
      contactPref: 'contact_preference', formType: 'form_type',
      // Shared
      space: 'space_type', spaceOther: 'space_type_custom', urg: 'urgency',
      // Janitorial
      size: 'space_size', exactSize: 'exact_sqft',
      janDays: 'cleaning_days', addDayPorter: 'also_wants_dayporter',
      window: 'cleaning_window',
      // Day Porter
      hrs: 'hours_per_day', customHrs: 'custom_hours',
      startTime: 'start_time', dpDays: 'coverage_days',
      porters: 'num_porters', porterCount: 'porter_count_custom',
      dpAreas: 'areas_covered', areaOther: 'area_custom',
      addJanitorial: 'also_wants_janitorial',
    };
    const WINDOW_MAP = {
      before_hours: 'Before hours', after_hours: 'After hours', flexible: 'Flexible'
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
      else if (k === 'window' && WINDOW_MAP[v]) value = WINDOW_MAP[v];
      formData[label] = value;
    }

    const service = formType === 'dayporter' ? 'dayporter' : 'janitorial';

    // AYS Ola 2 #8 — track integration success so a total-failure (network blip,
    // all services down) returns 502 to the client instead of a false-positive
    // success. The user sees an error toast and can retry or email directly.
    const integrations = { supabase: null, activecampaign: null, hubspot: null, postmark: null };
    const anyConfigured = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY)
      || !!(env.ACTIVECAMPAIGN_API_URL && env.ACTIVECAMPAIGN_API_KEY)
      || !!env.HUBSPOT_ACCESS_TOKEN
      || !!env.POSTMARK_API_KEY;

    // 4. UPSERT into Supabase (via REST API — no npm package needed)
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      integrations.supabase = false;
      try {
        const sbRes = await fetch(`${env.SUPABASE_URL}/rest/v1/leads?on_conflict=email,service`, {
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
          const errText = await sbRes.text();
          console.error('[submit-quote] Supabase error:', sbRes.status, errText);
        }
      } catch (dbErr) {
        console.error('[submit-quote] Supabase DB error:', dbErr.message);
      }
    }

    // 5. ActiveCampaign: sync contact + add "completed" tag
    if (env.ACTIVECAMPAIGN_API_URL && env.ACTIVECAMPAIGN_API_KEY) {
      integrations.activecampaign = false;
      try {
        const acHeaders = { 'Api-Token': env.ACTIVECAMPAIGN_API_KEY, 'Content-Type': 'application/json' };

        const syncRes = await fetch(`${env.ACTIVECAMPAIGN_API_URL}/api/3/contact/sync`, {
          method: 'POST', headers: acHeaders,
          body: JSON.stringify({ contact: { email, firstName: firstName || '', lastName: lastName || '', phone: phone || '' } })
        });
        const syncData = await syncRes.json();
        const contactId = syncData?.contact?.id;

        if (contactId) {
          const tagsRes = await fetch(`${env.ACTIVECAMPAIGN_API_URL}/api/3/tags?search=completed`, { headers: acHeaders });
          const tagsData = await tagsRes.json();
          let tagId = tagsData?.tags?.find(t => t.tag === 'completed')?.id;

          if (!tagId) {
            const createTagRes = await fetch(`${env.ACTIVECAMPAIGN_API_URL}/api/3/tags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ tag: { tag: 'completed', tagType: 'contact' } })
            });
            tagId = (await createTagRes.json())?.tag?.id;
          }

          if (tagId) {
            await fetch(`${env.ACTIVECAMPAIGN_API_URL}/api/3/contactTags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
            });
          }
          integrations.activecampaign = true;
        }
      } catch (e) {
        console.error('[submit-quote] ActiveCampaign error:', e.message);
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
        const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
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
          ecco_form_data: JSON.stringify(formData)
        };

        if (hsContactId) {
          await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hsContactId}`, {
            method: 'PATCH', headers: hsHeaders,
            body: JSON.stringify({ properties: contactProps })
          });
        } else {
          const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST', headers: hsHeaders,
            body: JSON.stringify({ properties: contactProps })
          });
          const createData = await createRes.json();
          hsContactId = createData?.id;
        }

        // Create a deal for pipeline tracking
        if (hsContactId) {
          const dealName = `${company || firstName} - ${service === 'dayporter' ? 'Day Porter' : 'Janitorial'} (${refNumber})`;
          const dealRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
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
            await fetch(
              `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts/${hsContactId}/deal_to_contact/3`,
              { method: 'PUT', headers: hsHeaders }
            );
          }
          integrations.hubspot = true;
        }
      } catch (e) {
        console.error('[submit-quote] HubSpot error:', e.message);
      }
    }

    // 7. Postmark: confirmation email to client
    if (env.POSTMARK_API_KEY) {
      integrations.postmark = false;
      try {
        const pmRes = await fetch('https://api.postmarkapp.com/email/withTemplate', {
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
      } catch (e) {
        console.error('[submit-quote] Postmark client email error:', e.message);
      }

      // 7. Postmark: notification email to owner
      try {
        await fetch('https://api.postmarkapp.com/email/withTemplate', {
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
      } catch (e) {
        console.error('[submit-quote] Postmark owner email error:', e.message);
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

    return new Response(JSON.stringify({ ok: true, ref: refNumber }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('[submit-quote] Fatal error:', err.message, err.stack);
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers: corsHeaders });
  }
}
