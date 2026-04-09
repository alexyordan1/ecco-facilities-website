export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (!path.startsWith('/api/crm-')) {
    return context.next();
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
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
    const userRes = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': context.env.SUPABASE_SERVICE_KEY
      }
    });

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
