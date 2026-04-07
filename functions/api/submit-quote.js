export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const env = context.env;
    let body;
    try { body = await context.request.json(); }
    catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: corsHeaders }); }

    const { em: email, fn: firstName, ln: lastName, ph: phone, co: company,
            turnstileToken, formType } = body;

    // Validate required fields
    if (!email || !firstName) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    // 1. Validate Turnstile server-side (temporarily disabled — widget hanging, error 300030)
    // TODO: re-enable after fixing Turnstile widget configuration
    // const turnstileSecret = env.CF_TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY;
    // if (turnstileSecret) { ... }

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
      // Day Porter
      hrs: 'hours_per_day', customHrs: 'custom_hours',
      startTime: 'start_time', dpDays: 'coverage_days',
      porters: 'num_porters', porterCount: 'porter_count_custom',
      dpAreas: 'areas_covered', areaOther: 'area_custom',
      addJanitorial: 'also_wants_janitorial',
    };
    const URGENCY_MAP = {
      asap: 'ASAP', '1-2w': '1–2 weeks', '1m': '1 month', flex: 'Flexible', unsure: 'Not sure'
    };
    const formData = {};
    for (const [k, v] of Object.entries(body)) {
      if (k.startsWith('_') || k === 'turnstileToken') continue;
      const label = KEY_MAP[k] || k;
      formData[label] = (k === 'urg' && URGENCY_MAP[v]) ? URGENCY_MAP[v] : v;
    }

    const service = formType === 'dayporter' ? 'dayporter' : 'janitorial';

    // 4. UPSERT into Supabase (via REST API — no npm package needed)
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
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
        if (!sbRes.ok) {
          const errText = await sbRes.text();
          console.error('[submit-quote] Supabase error:', sbRes.status, errText);
        }
      } catch (dbErr) {
        console.error('[submit-quote] Supabase DB error:', dbErr.message);
      }
    }

    // 5. ActiveCampaign: sync contact + add "completed" tag
    if (env.ACTIVECAMPAIGN_API_URL && env.ACTIVECAMPAIGN_API_KEY) {
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
        }
      } catch (e) {
        console.error('[submit-quote] ActiveCampaign error:', e.message);
      }
    }

    // 6. Postmark: confirmation email to client
    if (env.POSTMARK_API_KEY) {
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
            To: email,
            TemplateAlias: 'quote-confirmation',
            TemplateModel: {
              firstName: firstName || 'there',
              refNumber,
              service: service === 'dayporter' ? 'Day Porter Services' : 'Janitorial Services'
            }
          })
        });
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
              urgency: body.urg || 'Standard',
              formData: JSON.stringify(formData, null, 2)
            }
          })
        });
      } catch (e) {
        console.error('[submit-quote] Postmark owner email error:', e.message);
      }
    }

    return new Response(JSON.stringify({ ok: true, ref: refNumber }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('[submit-quote] Fatal error:', err.message, err.stack);
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers: corsHeaders });
  }
}
