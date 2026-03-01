const http = require('http');

const data = JSON.stringify({
  agentId: 'not-a-uuid',
  url: 'https://example.com',
  mode: 'priority'
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/knowledge/website',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.write(data);
req.end();
