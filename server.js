const http = require('http');
const url = require('url');
const WEBHOOK_SECRET = '0369819604040d86dbdcaf24f7a19b695ef1c79d2840a7df';
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  console.log(`${req.method} ${parsedUrl.pathname}`);
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  if (parsedUrl.pathname === '/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token !== WEBHOOK_SECRET) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      try {
        const data = JSON.parse(body);
        console.log(`✅ Post received: ${data.post_id}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id: data.post_id }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Server running on port ${PORT}`);
});
