var RESP_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function jsonOk(data, s) { return new Response(JSON.stringify({ ok: true, data: data }), { status: s || 200, headers: RESP_HEADERS }); }
function jsonErr(m, s) { return new Response(JSON.stringify({ ok: false, error: m }), { status: s || 400, headers: RESP_HEADERS }); }

export async function onRequestGet(context) {
  var env = context.env;
  var sbH = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY };
  var url = new URL(context.request.url);
  var leadId = url.searchParams.get('lead_id');

  try {
    var path = leadId
      ? '/lead_tags?lead_id=eq.' + parseInt(leadId, 10) + '&order=tag.asc'
      : '/lead_tags?select=tag&order=tag.asc';

    var res = await fetch(env.SUPABASE_URL + '/rest/v1' + path, { headers: sbH });
    if (!res.ok) return jsonErr('Failed to fetch tags', 500);
    var data = await res.json();

    if (!leadId) {
      /* Return unique tags */
      var unique = [];
      var seen = {};
      data.forEach(function(t) { if (!seen[t.tag]) { seen[t.tag] = true; unique.push(t.tag); } });
      return jsonOk({ tags: unique });
    }
    return jsonOk({ tags: data });
  } catch (e) { return jsonErr('Server error', 500); }
}

export async function onRequestPost(context) {
  var env = context.env;
  var sbH = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

  var body;
  try { body = await context.request.json(); } catch (e) { return jsonErr('Invalid JSON', 400); }

  var leadId = parseInt(body.lead_id, 10);
  var tag = (body.tag || '').trim().toLowerCase();
  if (!leadId || !tag) return jsonErr('lead_id and tag required', 400);
  if (tag.length > 30) return jsonErr('Tag too long (max 30 chars)', 400);

  try {
    var res = await fetch(env.SUPABASE_URL + '/rest/v1/lead_tags', {
      method: 'POST', headers: sbH,
      body: JSON.stringify({ lead_id: leadId, tag: tag })
    });
    if (!res.ok) return jsonErr('Tag already exists or error', 409);
    var created = await res.json();
    return jsonOk({ tag: created[0] || { lead_id: leadId, tag: tag } }, 201);
  } catch (e) { return jsonErr('Server error', 500); }
}

export async function onRequestDelete(context) {
  var env = context.env;
  var sbH = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY };
  var url = new URL(context.request.url);
  var leadId = parseInt(url.searchParams.get('lead_id'), 10);
  var tag = url.searchParams.get('tag');
  if (!leadId || !tag) return jsonErr('lead_id and tag required', 400);

  try {
    await fetch(env.SUPABASE_URL + '/rest/v1/lead_tags?lead_id=eq.' + leadId + '&tag=eq.' + encodeURIComponent(tag), {
      method: 'DELETE', headers: sbH
    });
    return jsonOk({ deleted: true });
  } catch (e) { return jsonErr('Server error', 500); }
}
