export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: context.env.GITHUB_CLIENT_ID,
      client_secret: context.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const data = await tokenRes.json();

  if (data.error) {
    return new Response(`OAuth error: ${data.error_description || data.error}`, { status: 401 });
  }

  const html = `<!DOCTYPE html><html><head><script>
(function() {
  function sendMsg(msg) {
    var auth = msg.token ? 'token' : 'error';
    window.opener.postMessage(
      'authorization:github:' + auth + ':' + JSON.stringify(msg),
      window.origin
    );
  }
  sendMsg({ token: "${data.access_token}", provider: "github" });
  window.close();
})();
</script></head><body><p>Authorizing...</p></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
