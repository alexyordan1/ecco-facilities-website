const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

function sbHeaders(env) {
  return {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json'
  };
}

function jsonOk(data, status) {
  return new Response(JSON.stringify({ ok: true, data }), { status: status || 200, headers: HEADERS });
}

function jsonErr(error, status) {
  return new Response(JSON.stringify({ ok: false, error }), { status: status || 400, headers: HEADERS });
}

// GET: list activities for a lead
export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const leadId = url.searchParams.get('lead_id');

  if (!leadId || isNaN(parseInt(leadId, 10))) {
    return jsonErr('Valid lead_id is required', 400);
  }

  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || 50));

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/lead_activities?lead_id=eq.${parseInt(leadId, 10)}&order=created_at.desc&limit=${limit}`,
      { headers: sbHeaders(env) }
    );

    if (!res.ok) return jsonErr('Failed to fetch activities', 502);
    const activities = await res.json();
    return jsonOk({ activities });
  } catch {
    return jsonErr('Server error', 500);
  }
}
