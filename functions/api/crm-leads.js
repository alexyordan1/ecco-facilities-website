const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

const ALLOWED_SORT = ['created_at', 'first_name', 'company', 'service', 'status', 'pipeline_stage'];
const UPDATABLE_FIELDS = ['pipeline_stage', 'estimated_value', 'last_contacted_at', 'lost_reason'];

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

function sanitizeSearch(str) {
  return str.replace(/[%_\\*]/g, '');
}

function parseCount(contentRange) {
  if (!contentRange) return 0;
  const parts = contentRange.split('/');
  const total = parts[1];
  if (!total || total === '*') return 0;
  return parseInt(total, 10) || 0;
}

// GET: list leads, single lead, or pipeline stages
export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const params = url.searchParams;

  // Return pipeline stages list
  if (params.get('stages') === 'true') {
    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/pipeline_stages?select=*&order=position.asc`,
        { headers: sbHeaders(env) }
      );
      if (!res.ok) return jsonErr('Failed to fetch stages', 502);
      const stages = await res.json();
      return jsonOk({ stages });
    } catch {
      return jsonErr('Server error', 500);
    }
  }

  // Single lead by id
  const id = params.get('id');
  if (id) {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) return jsonErr('Invalid id', 400);

    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/leads?id=eq.${parsed}&select=*`,
        { headers: sbHeaders(env) }
      );
      if (!res.ok) return jsonErr('Failed to fetch lead', 502);
      const rows = await res.json();
      if (!rows.length) return jsonErr('Lead not found', 404);
      return jsonOk({ lead: rows[0] });
    } catch {
      return jsonErr('Server error', 500);
    }
  }

  // List leads with filters + pagination
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page'), 10) || 25));
  const offset = (page - 1) * perPage;

  const sort = ALLOWED_SORT.includes(params.get('sort')) ? params.get('sort') : 'created_at';
  const order = params.get('order') === 'asc' ? 'asc' : 'desc';

  let queryUrl = `${env.SUPABASE_URL}/rest/v1/leads?select=*&order=${sort}.${order}&offset=${offset}&limit=${perPage}`;

  const status = params.get('status');
  if (status === 'partial' || status === 'completed') {
    queryUrl += `&status=eq.${status}`;
  }

  const service = params.get('service');
  if (service === 'janitorial' || service === 'dayporter') {
    queryUrl += `&service=eq.${service}`;
  }

  const stage = params.get('stage');
  if (stage) {
    queryUrl += `&pipeline_stage=eq.${encodeURIComponent(stage)}`;
  }

  const search = params.get('search');
  if (search) {
    const clean = sanitizeSearch(search.trim());
    if (clean) {
      const encoded = encodeURIComponent(`(email.ilike.*${clean}*,first_name.ilike.*${clean}*,last_name.ilike.*${clean}*,company.ilike.*${clean}*,ref_number.ilike.*${clean}*)`);
      queryUrl += `&or=${encoded}`;
    }
  }

  try {
    const res = await fetch(queryUrl, {
      headers: {
        ...sbHeaders(env),
        'Prefer': 'count=exact'
      }
    });

    if (!res.ok) return jsonErr('Failed to fetch leads', 502);

    const leads = await res.json();
    const total = parseCount(res.headers.get('content-range'));
    const pages = Math.ceil(total / perPage) || 1;

    return jsonOk({ leads, total, page, per_page: perPage, pages });
  } catch {
    return jsonErr('Server error', 500);
  }
}

// PATCH: update a lead
export async function onRequestPatch(context) {
  const env = context.env;

  let body;
  try { body = await context.request.json(); }
  catch { return jsonErr('Invalid JSON', 400); }

  const { id } = body;
  if (!id || isNaN(parseInt(id, 10))) return jsonErr('Valid id is required', 400);

  // Build update from whitelisted fields only
  const update = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  }

  if (!Object.keys(update).length) return jsonErr('No valid fields to update', 400);

  try {
    // 1. Update the lead
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/leads?id=eq.${parseInt(id, 10)}`, {
      method: 'PATCH',
      headers: {
        ...sbHeaders(env),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(update)
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      return jsonErr('Failed to update lead: ' + errText, 502);
    }

    const rows = await patchRes.json();
    if (!rows.length) return jsonErr('Lead not found', 404);

    const updatedLead = rows[0];

    // 2. Log activity for each changed field
    const activities = [];

    if (update.pipeline_stage !== undefined) {
      activities.push({
        lead_id: parseInt(id, 10),
        type: 'stage_change',
        description: 'Stage changed to ' + update.pipeline_stage,
        metadata: {}
      });
    }

    if (update.last_contacted_at !== undefined) {
      activities.push({
        lead_id: parseInt(id, 10),
        type: 'contacted',
        description: 'Marked as contacted',
        metadata: {}
      });
    }

    if (update.lost_reason !== undefined) {
      activities.push({
        lead_id: parseInt(id, 10),
        type: 'stage_change',
        description: 'Lost reason: ' + update.lost_reason,
        metadata: {}
      });
    }

    if (update.estimated_value !== undefined) {
      activities.push({
        lead_id: parseInt(id, 10),
        type: 'field_updated',
        description: 'Estimated value set to $' + update.estimated_value,
        metadata: {}
      });
    }

    // Insert all activities (fire-and-forget for speed, but await to ensure consistency)
    if (activities.length) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/lead_activities`, {
        method: 'POST',
        headers: {
          ...sbHeaders(env),
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(activities)
      });
    }

    return jsonOk({ lead: updatedLead });
  } catch {
    return jsonErr('Server error', 500);
  }
}
