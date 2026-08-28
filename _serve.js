const http = require('http');
const fs = require('fs');
const path = require('path');

const root = 'D:/workspace/TaskManager';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(req.url));
  if (p.endsWith('/')) p += 'index.html';
  const ext = path.extname(p).toLowerCase();
  fs.readFile(p, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found: ' + req.url);
    } else {
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    }
  });
});
server.listen(8090, () => console.log('serve http://127.0.0.1:8090'));
