// Ola 1 #1 — CORS tightening. Previously used indexOf() substring matching,
// which allowed attacker-registered domains like `evil-eccofacilities.com` or
// `attacker.pages.dev` to bypass cross-origin protection. Now: exact-match
// allowlist + single preview origin from env, matching submit-quote.js.
const ALLOWED_ORIGINS = [
  'https://eccofacilities.com',
  'https://www.eccofacilities.com',
  'http://localhost:8080'
];
function resolveCorsOrigin(origin, env) {
  if (!origin) return 'https://eccofacilities.com';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  const previewDomain = env && env.ALLOWED_PREVIEW_ORIGIN;
  if (previewDomain && origin === previewDomain) return origin;
  return 'https://eccofacilities.com';
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (!path.startsWith('/api/crm-')) {
    return context.next();
  }

  const requestOrigin = context.request.headers.get('Origin');

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': resolveCorsOrigin(requestOrigin, context.env),
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
      }
    });
  }

  if (path === '/api/crm-auth' && (context.request.method === 'POST' || context.request.method === 'PATCH')) {
    return context.next();
  }

  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ ok: false, error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.slice(7);

  try {
    // Ola 7 — timeout the token-verification fetch. Without it, a slow or
    // hung Supabase response would pin the worker until CF's 30s wall-clock
    // limit, blocking every /api/crm-* request behind this middleware and
    // amounting to an indirect DoS vector. 5s is generous for a token check.
    const verifyController = new AbortController();
    const verifyTimeout = setTimeout(() => verifyController.abort(), 5000);
    let userRes;
    try {
      userRes = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': context.env.SUPABASE_SERVICE_KEY
        },
        signal: verifyController.signal
      });
    } finally {
      clearTimeout(verifyTimeout);
    }

    if (!userRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await userRes.json();

    context.data = context.data || {};
    context.data.user = { id: user.id, email: user.email };
    context.data.token = token;

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return context.next();
}
