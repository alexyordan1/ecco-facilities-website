// 2026-11-13: endpoint retired. The site's chat widget was removed on 2026-05-01 (D125) and no page calls
// this API any more. It was still live, though: any non-browser client could use Ecco's Anthropic API key
// through it, and its prompt carried claims Ecco no longer makes ("100% eco-certified", invented scarcity).
// Every request now gets 410 Gone and nothing is sent to Anthropic. The previous version is in git history.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(410).json({ error: 'This service has been retired.' });
};
