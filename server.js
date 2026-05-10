const http = require('http');
const url = require('url');

const WEBHOOK_SECRET = '0369819604040d86dbdcaf24f7a19b695ef1c79d2840a7df';
const BOT_TOKEN = '7590495938:AAGGMJF0pddITadtdctYz0G8BjR83Zwp7Vk';  // ← ДОБАВЬТЕ ТОКЕН БОТА
const CHANNEL_ID = '@farangfm';  // или -1002273965696
const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {
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
  
  // Health check
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Webhook endpoint
  if (parsedUrl.pathname === '/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const token = req.headers.authorization?.split(' ')[1];
      
      console.log(`Webhook received, auth: ${token ? token.substring(0,20) + '...' : 'None'}`);
      
      if (token !== WEBHOOK_SECRET) {
        console.log('❌ Unauthorized');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      
      try {
        const data = JSON.parse(body);
        console.log(`✅ Post received: ${data.post_id}`);
        
        // ========== ОТПРАВКА В TELEGRAM ==========
        if (BOT_TOKEN && CHANNEL_ID) {
          const message = data.rewritten_text || data.original_text;
          
          const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
          
          // Используем https модуль для запроса
          const https = require('https');
          const postData = JSON.stringify({
            chat_id: CHANNEL_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false
          });
          
          const telegramReq = https.request(telegramUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          }, (telegramRes) => {
            let responseBody = '';
            telegramRes.on('data', chunk => responseBody += chunk);
            telegramRes.on('end', () => {
              console.log(`📨 Telegram response: ${telegramRes.statusCode}`);
              if (telegramRes.statusCode === 200) {
                console.log('✅ Message sent to Telegram channel!');
              } else {
                console.log('❌ Failed to send to Telegram:', responseBody);
              }
            });
          });
          
          telegramReq.on('error', (err) => {
            console.log('❌ Telegram request error:', err.message);
          });
          
          telegramReq.write(postData);
          telegramReq.end();
        } else {
          console.log('⚠️ BOT_TOKEN or CHANNEL_ID not set');
        }
        // =======================================
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id: data.post_id }));
      } catch (e) {
        console.log('❌ Invalid JSON:', e.message);
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
  console.log(`\n✅ FARANG.FM API Server running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🏥 Health: /health`);
  console.log(`🔗 Webhook: POST /webhook`);
  if (BOT_TOKEN) {
    console.log(`🤖 Telegram bot configured`);
    console.log(`📢 Channel: ${CHANNEL_ID}`);
  } else {
    console.log(`⚠️ BOT_TOKEN not set - messages will not be sent to Telegram`);
  }
});
