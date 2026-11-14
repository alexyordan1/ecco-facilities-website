const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DIR = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.xsl': 'application/xml'
};

http.createServer((req, res) => {
  // 2026-10-19 — strip the query first: '/?utm_source=…' used to miss the '/' rule and 404 (Cloudflare serves it).
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(DIR, urlPath === '/' ? 'index.html' : urlPath);
  // 2026-11-13 — resolve extensionless URLs the way Cloudflare Pages does, since internal links
  // are now root-relative and extensionless: /janitorial → janitorial.html, /blog → blog.html,
  // /dir/ → dir/index.html. Paths that already carry an extension are served as-is.
  const candidates = path.extname(filePath)
    ? [filePath]
    : [filePath, filePath + '.html', path.join(filePath, 'index.html')];

  (function tryNext(i) {
    if (i >= candidates.length) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    fs.readFile(candidates[i], (err, data) => {
      if (err) return tryNext(i + 1);
      const ext = path.extname(candidates[i]).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  })(0);
}).listen(PORT, () => {
  console.log(`\n  Ecco Facilities site running at:\n`);
  console.log(`  → http://localhost:${PORT}\n`);
  console.log(`  Open that URL in your browser.\n  Press Ctrl+C to stop.\n`);
});
