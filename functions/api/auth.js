export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  const scope = 'repo,user';
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`;
  return Response.redirect(authUrl, 302);
}
