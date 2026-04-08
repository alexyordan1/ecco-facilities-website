export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ACTIVECAMPAIGN_API_URL, ACTIVECAMPAIGN_API_KEY } = context.env;

    let body;
    try { body = await context.request.json(); }
    catch { return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders }); }

    const { email, firstName, phone } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    // 1. Insert partial lead into Supabase (skip if already completed)
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        // First check if lead already exists and is completed
        const checkRes = await fetch(
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
          await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              email,
              first_name: firstName || null,
              phone: phone || null,
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

        const syncRes = await fetch(`${ACTIVECAMPAIGN_API_URL}/api/3/contact/sync`, {
          method: 'POST', headers: acHeaders,
          body: JSON.stringify({ contact: { email, firstName: firstName || '', phone: phone || '' } })
        });
        const syncData = await syncRes.json();
        const contactId = syncData?.contact?.id;

        if (contactId) {
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

          if (tagId) {
            await fetch(`${ACTIVECAMPAIGN_API_URL}/api/3/contactTags`, {
              method: 'POST', headers: acHeaders,
              body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
            });
          }

          // Update Supabase with AC contact ID
          if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
            try {
              await fetch(
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

        const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
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
          firstname: firstName || '',
          phone: phone || '',
          ecco_lead_status: 'partial'
        };

        if (existing?.id) {
          // Don't downgrade completed contacts back to partial
          if (existing.properties?.ecco_lead_status !== 'completed') {
            await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existing.id}`, {
              method: 'PATCH', headers: hsHeaders,
              body: JSON.stringify({ properties: contactProps })
            });
          }
        } else {
          await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
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
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }
}
