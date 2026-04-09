export async function onRequestPost(context) {
  const env = context.env;
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  let body;
  try { body = await context.request.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid request body' }), { status: 400, headers }); }

  const { email, password } = body;
  if (!email || !password) {
    return new Response(JSON.stringify({ ok: false, error: 'Email and password are required' }), { status: 400, headers });
  }

  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email or password' }), { status: 401, headers });
    }

    const data = await res.json();
    return new Response(JSON.stringify({
      ok: true,
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user: { id: data.user.id, email: data.user.email }
      }
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers });
  }
}

export async function onRequestPatch(context) {
  const env = context.env;
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  let body;
  try { body = await context.request.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid request body' }), { status: 400, headers }); }

  const { refresh_token } = body;
  if (!refresh_token) {
    return new Response(JSON.stringify({ ok: false, error: 'Refresh token is required' }), { status: 400, headers });
  }

  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token })
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Session expired. Please log in again.' }), { status: 401, headers });
    }

    const data = await res.json();
    return new Response(JSON.stringify({
      ok: true,
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user: { id: data.user.id, email: data.user.email }
      }
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers });
  }
}

export async function onRequestGet(context) {
  const user = context.data?.user;
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true, data: { user } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
