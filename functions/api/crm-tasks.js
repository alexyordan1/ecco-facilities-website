var RESP_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function jsonOk(data, status) {
  return new Response(JSON.stringify({ ok: true, data: data }), { status: status || 200, headers: RESP_HEADERS });
}
function jsonErr(msg, status) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status: status || 400, headers: RESP_HEADERS });
}

export async function onRequestGet(context) {
  var env = context.env;
  var sbHeaders = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' };
  var url = new URL(context.request.url);

  var leadId = url.searchParams.get('lead_id');
  var upcoming = url.searchParams.get('upcoming');

  try {
    var path;
    if (leadId) {
      /* Tasks for a specific lead */
      path = '/lead_tasks?lead_id=eq.' + parseInt(leadId, 10) + '&order=completed.asc,due_date.asc.nullslast&limit=50';
    } else if (upcoming) {
      /* All upcoming/overdue tasks (not completed) */
      var days = parseInt(url.searchParams.get('days'), 10) || 7;
      var futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      path = '/lead_tasks?completed=eq.false&or=(due_date.is.null,due_date.lte.' + futureDate.toISOString() + ')&order=due_date.asc.nullslast&limit=20';
    } else {
      return jsonErr('lead_id or upcoming param required', 400);
    }

    /* Join with leads to get lead name */
    path += '&select=*,leads(id,first_name,last_name,company)';

    var res = await fetch(env.SUPABASE_URL + '/rest/v1' + path, { headers: sbHeaders });
    if (!res.ok) return jsonErr('Failed to fetch tasks', 500);
    var tasks = await res.json();
    return jsonOk({ tasks: tasks });
  } catch (err) {
    return jsonErr('Server error', 500);
  }
}

export async function onRequestPost(context) {
  var env = context.env;
  var sbHeaders = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

  var body;
  try { body = await context.request.json(); }
  catch (e) { return jsonErr('Invalid JSON', 400); }

  var leadId = parseInt(body.lead_id, 10);
  var title = (body.title || '').trim();
  if (!leadId || !title) return jsonErr('lead_id and title are required', 400);

  var task = {
    lead_id: leadId,
    title: title,
    description: (body.description || '').trim() || null,
    due_date: body.due_date || null,
    created_by: (context.data && context.data.user) ? context.data.user.email : 'admin'
  };

  try {
    var res = await fetch(env.SUPABASE_URL + '/rest/v1/lead_tasks', {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify(task)
    });
    if (!res.ok) return jsonErr('Failed to create task', 500);
    var created = await res.json();

    /* Log activity */
    await fetch(env.SUPABASE_URL + '/rest/v1/lead_activities', {
      method: 'POST',
      headers: { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ lead_id: leadId, type: 'task_created', description: 'Task: ' + title.substring(0, 80), metadata: { task_id: created[0] ? created[0].id : null } })
    });

    return jsonOk({ task: created[0] || task }, 201);
  } catch (err) {
    return jsonErr('Server error', 500);
  }
}

export async function onRequestPatch(context) {
  var env = context.env;
  var sbHeaders = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

  var body;
  try { body = await context.request.json(); }
  catch (e) { return jsonErr('Invalid JSON', 400); }

  var id = parseInt(body.id, 10);
  if (!id) return jsonErr('id is required', 400);

  var update = {};
  if (body.completed !== undefined) {
    update.completed = !!body.completed;
    if (update.completed) update.completed_at = new Date().toISOString();
    else update.completed_at = null;
  }
  if (body.title) update.title = body.title.trim();
  if (body.due_date !== undefined) update.due_date = body.due_date;

  try {
    var res = await fetch(env.SUPABASE_URL + '/rest/v1/lead_tasks?id=eq.' + id, {
      method: 'PATCH',
      headers: sbHeaders,
      body: JSON.stringify(update)
    });
    if (!res.ok) return jsonErr('Failed to update task', 500);
    var result = await res.json();
    return jsonOk({ task: result[0] || {} });
  } catch (err) {
    return jsonErr('Server error', 500);
  }
}

export async function onRequestDelete(context) {
  var env = context.env;
  var sbHeaders = { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY };
  var url = new URL(context.request.url);
  var id = parseInt(url.searchParams.get('id'), 10);
  if (!id) return jsonErr('id param required', 400);

  try {
    await fetch(env.SUPABASE_URL + '/rest/v1/lead_tasks?id=eq.' + id, { method: 'DELETE', headers: sbHeaders });
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonErr('Server error', 500);
  }
}
