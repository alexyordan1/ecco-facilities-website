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

// GET: list notes for a lead
export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const leadId = url.searchParams.get('lead_id');

  if (!leadId || isNaN(parseInt(leadId, 10))) {
    return jsonErr('Valid lead_id is required', 400);
  }

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/lead_notes?lead_id=eq.${parseInt(leadId, 10)}&order=created_at.desc`,
      { headers: sbHeaders(env) }
    );

    if (!res.ok) return jsonErr('Failed to fetch notes', 502);
    const notes = await res.json();
    return jsonOk({ notes });
  } catch {
    return jsonErr('Server error', 500);
  }
}

// POST: create a note
export async function onRequestPost(context) {
  const env = context.env;

  let body;
  try { body = await context.request.json(); }
  catch { return jsonErr('Invalid JSON', 400); }

  const { lead_id, note } = body;

  if (!lead_id || isNaN(parseInt(lead_id, 10))) {
    return jsonErr('Valid lead_id is required', 400);
  }

  const trimmed = (note || '').trim();
  if (!trimmed) {
    return jsonErr('Note cannot be empty', 400);
  }

  const userEmail = context.data?.user?.email || 'unknown';
  const parsedLeadId = parseInt(lead_id, 10);

  try {
    // 1. Insert the note
    const noteRes = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_notes`, {
      method: 'POST',
      headers: {
        ...sbHeaders(env),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        lead_id: parsedLeadId,
        note: trimmed,
        created_by: userEmail
      })
    });

    if (!noteRes.ok) {
      const errText = await noteRes.text();
      return jsonErr('Failed to create note: ' + errText, 502);
    }

    const created = await noteRes.json();

    // 2. Log activity
    await fetch(`${env.SUPABASE_URL}/rest/v1/lead_activities`, {
      method: 'POST',
      headers: {
        ...sbHeaders(env),
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        lead_id: parsedLeadId,
        type: 'note_added',
        description: trimmed.length > 100 ? trimmed.slice(0, 100) + '...' : trimmed,
        metadata: { created_by: userEmail }
      })
    });

    return jsonOk({ note: created[0] }, 201);
  } catch {
    return jsonErr('Server error', 500);
  }
}
