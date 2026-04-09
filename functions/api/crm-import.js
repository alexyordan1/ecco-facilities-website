export async function onRequestPost(context) {
  var env = context.env;
  var headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  var sbHeaders = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

  var body;
  try { body = await context.request.json(); }
  catch (e) { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: headers }); }

  var leads = body.leads;
  if (!Array.isArray(leads) || leads.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'leads array is required' }), { status: 400, headers: headers });
  }

  /* Cap at 100 per import */
  if (leads.length > 100) {
    return new Response(JSON.stringify({ ok: false, error: 'Maximum 100 leads per import' }), { status: 400, headers: headers });
  }

  /* Validate and clean each lead */
  var cleaned = leads.map(function(l) {
    return {
      first_name: (l.first_name || l.name || '').trim().split(' ')[0] || null,
      last_name: (l.last_name || '').trim() || (l.name || '').trim().split(' ').slice(1).join(' ') || null,
      email: (l.email || '').trim().toLowerCase() || null,
      phone: (l.phone || '').trim() || null,
      company: (l.company || '').trim() || null,
      service: (l.service || 'janitorial').toLowerCase() === 'dayporter' ? 'dayporter' : 'janitorial',
      status: 'completed',
      pipeline_stage: 'new',
      form_data: { imported: true, source: 'csv_import' }
    };
  }).filter(function(l) { return l.email || l.first_name; });

  if (cleaned.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'No valid leads found (each must have at least email or name)' }), { status: 400, headers: headers });
  }

  try {
    var res = await fetch(env.SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify(cleaned)
    });

    if (!res.ok) {
      var errText = await res.text();
      return new Response(JSON.stringify({ ok: false, error: 'Import failed' }), { status: 500, headers: headers });
    }

    var imported = await res.json();
    return new Response(JSON.stringify({ ok: true, data: { imported: imported.length } }), { status: 201, headers: headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers: headers });
  }
}
