// Admin leads API (2026-06-25) — reads the Cloudflare D1 leads store for the
// internal dashboard at /admin.html. Token-gated via env.ADMIN_TOKEN.
//
// SECURITY: the token check is a baseline. For real protection put Cloudflare
// Access (zero-trust SSO) in front of /admin.html and /api/leads — no code
// change needed, and it removes the shared-token risk entirely.

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
  });
}

// length-independent compare to avoid trivial timing leaks
function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet(context) {
  const env = context.env;
  if (!env.ADMIN_TOKEN) return json({ ok: false, error: 'Dashboard not configured — set ADMIN_TOKEN.' }, 503);

  const url = new URL(context.request.url);
  const auth = context.request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '') || url.searchParams.get('key') || '';
  if (!token || !safeEqual(token, env.ADMIN_TOKEN)) return json({ ok: false, error: 'Unauthorized' }, 401);

  if (!env.DB) return json({ ok: false, error: 'No D1 database bound (DB). Create it + bind it first.' }, 503);

  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '300', 10) || 300, 1000);
    const { results } = await env.DB.prepare(
      'SELECT ref_number, email, first_name, last_name, phone, company, service, status, form_data, completed_at, created_at ' +
      'FROM leads ORDER BY COALESCE(completed_at, created_at) DESC LIMIT ?'
    ).bind(limit).all();
    return json({ ok: true, count: results.length, leads: results });
  } catch (e) {
    return json({ ok: false, error: 'Query failed — is the schema applied? (schema/leads.sql)' }, 500);
  }
}
