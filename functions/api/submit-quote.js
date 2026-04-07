import { neon } from '@neondatabase/serverless';

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
    // if (turnstileSecret) {
    //   const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { ... });
    //   const tsData = await tsRes.json();
    //   if (!tsData.success) return 403;
    // }

    // 2. Generate reference number
    const prefix = formType === 'dayporter' ? 'EDP-' : 'ECJ-';
    const refNumber = prefix + Date.now().toString(36).toUpperCase();

    // 3. Build form_data JSONB (strip internal fields)
    const formData = {};
    for (const [k, v] of Object.entries(body)) {
      if (!k.startsWith('_') && k !== 'turnstileToken') formData[k] = v;
    }

    // 4. UPSERT into Neon
    const service = formType === 'dayporter' ? 'dayporter' : 'janitorial';
    if (env.NEON_DATABASE_URL) {
      try {
        const sql = neon(env.NEON_DATABASE_URL);
        await sql`
          INSERT INTO leads (email, first_name, last_name, phone, company, service, status, form_data, ref_number, completed_at)
          VALUES (${email}, ${firstName || null}, ${lastName || null}, ${phone || null}, ${company || null}, ${service}, 'completed', ${JSON.stringify(formData)}, ${refNumber}, NOW())
          ON CONFLICT (email) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            company = EXCLUDED.company,
            service = EXCLUDED.service,
            status = 'completed',
            form_data = EXCLUDED.form_data,
            ref_number = EXCLUDED.ref_number,
            completed_at = NOW()
        `;
      } catch (dbErr) {
        console.error('[submit-quote] Neon DB error:', dbErr.message);
      }
    }

    // --- Non-blocking integrations (errors logged but don't fail the request) ---

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
          // Find or create "completed" tag
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
              refNumber: refNumber,
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
              email: email,
              phone: phone || 'N/A',
              company: company || 'N/A',
              service: service === 'dayporter' ? 'Day Porter Services' : 'Janitorial Services',
              refNumber: refNumber,
              urgency: body.urg || 'Standard',
              formData: JSON.stringify(formData, null, 2)
            }
          })
        });
      } catch (e) {
        console.error('[submit-quote] Postmark owner email error:', e.message);
      }
    }

    // 8. Twilio: SMS to owner
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM && env.NOTIFY_PHONE) {
      try {
        const smsBody =
          '\uD83D\uDD14 NEW ECCO LEAD\n' +
          `Ref: ${refNumber}\n` +
          `Name: ${(firstName || '').trim()} ${(lastName || '').trim()}\n` +
          (phone ? `Phone: ${phone}\n` : '') +
          `Email: ${email}\n` +
          `Service: ${service === 'dayporter' ? 'Day Porter' : 'Janitorial'}` +
          (body.urg ? `\nUrgency: ${body.urg}` : '');

        const params = new URLSearchParams();
        params.append('From', env.TWILIO_FROM);
        params.append('To', env.NOTIFY_PHONE);
        params.append('Body', smsBody);

        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
      } catch (e) {
        console.error('[submit-quote] Twilio error:', e.message);
      }
    }

    return new Response(JSON.stringify({ ok: true, ref: refNumber }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('[submit-quote] Fatal error:', err.message, err.stack);
    return new Response(JSON.stringify({ ok: false, error: 'Server error', code: 'FATAL', detail: err.message }), { status: 500, headers: corsHeaders });
  }
}
