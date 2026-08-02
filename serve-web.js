const http = require('http');
const fs = require('fs');
const path = require('path');
const dist = '/opt/data/repositorios/2026-08-02-slumber/apps/web/dist/slumber-web/browser';

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const proxyReq = http.request(
      { host: 'localhost', port: 3112, path: req.url, method: req.method, headers: req.headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    req.pipe(proxyReq);
    proxyReq.on('error', () => {
      res.writeHead(502);
      res.end('bad gateway');
    });
    return;
  }
  let p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  let file = path.join(dist, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  const ext = path.extname(file);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
server.listen(4200, () => console.log('web on 4200'));
