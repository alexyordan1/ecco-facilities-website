import { neon } from '@neondatabase/serverless';

export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { NEON_DATABASE_URL, ACTIVECAMPAIGN_API_URL, ACTIVECAMPAIGN_API_KEY } = context.env;

    let body;
    try { body = await context.request.json(); }
    catch { return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders }); }

    const { email, firstName, phone } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    // 1. Insert partial lead into Neon (skip if already completed)
    let contactId = null;
    if (NEON_DATABASE_URL) {
      try {
        const sql = neon(NEON_DATABASE_URL);
        await sql`
          INSERT INTO leads (email, first_name, phone, status)
          VALUES (${email}, ${firstName || null}, ${phone || null}, 'partial')
          ON CONFLICT (email) DO UPDATE SET
            first_name = COALESCE(EXCLUDED.first_name, leads.first_name),
            phone = COALESCE(EXCLUDED.phone, leads.phone)
          WHERE leads.status != 'completed'
        `;
      } catch (e) {
        console.error('[capture-partial] Neon error:', e.message);
      }
    }

    // 2. Sync contact in ActiveCampaign + add partial_lead tag
    if (ACTIVECAMPAIGN_API_URL && ACTIVECAMPAIGN_API_KEY) {
      try {
        const acHeaders = { 'Api-Token': ACTIVECAMPAIGN_API_KEY, 'Content-Type': 'application/json' };

        // Create or update contact
        const syncRes = await fetch(`${ACTIVECAMPAIGN_API_URL}/api/3/contact/sync`, {
          method: 'POST', headers: acHeaders,
          body: JSON.stringify({ contact: { email, firstName: firstName || '', phone: phone || '' } })
        });
        const syncData = await syncRes.json();
        contactId = syncData?.contact?.id;

        if (contactId) {
          // Find or create "partial_lead" tag
          const tagsRes = await fetch(`${ACTIVECAMPAIGN_API_URL}/api/3/tags?search=partial_lead`, { headers: acHeaders });
          const tagsData = await tagsRes.json();
          let tagId = tagsData?.tags?.find(t => t.tag === 'partial_lead')?.id;

          if (!tagId) {
            const createTagRes = await fetch(`${ACTIVECAMPAIGN_API_URL}/api/3/tags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ tag: { tag: 'partial_lead', tagType: 'contact' } })
            });
            tagId = (await createTagRes.json())?.tag?.id;
          }

          // Add tag to contact
          if (tagId) {
            await fetch(`${ACTIVECAMPAIGN_API_URL}/api/3/contactTags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
            });
          }

          // Update Neon with AC contact ID
          if (NEON_DATABASE_URL) {
            try {
              const sql = neon(NEON_DATABASE_URL);
              await sql`UPDATE leads SET ac_contact_id = ${contactId} WHERE email = ${email}`;
            } catch (e) {
              console.error('[capture-partial] Neon AC ID update error:', e.message);
            }
          }
        }
      } catch (e) {
        console.error('[capture-partial] ActiveCampaign error:', e.message);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[capture-partial] Unexpected error:', err.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }
}
