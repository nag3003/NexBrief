const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const requestedPort = Number(process.env.PORT) || 3000;
let currentPort = requestedPort;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.join(root, normalized);
  return resolved.startsWith(root) ? resolved : root;
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    send(res, 400, 'Bad request');
    return;
  }

  const requestPath = req.url === '/' ? '/index.html' : req.url;
  let filePath = safeResolve(requestPath);

  fs.stat(filePath, (statErr, stats) => {
    if (!statErr && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (statErr) {
      filePath = path.join(root, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        send(res, 404, 'Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, data, contentTypes[ext] || 'application/octet-stream');
    });
  });
});

function listen(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`NexBrief running at http://localhost:${port}`);
  });
}

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    currentPort += 1;
    if (currentPort <= requestedPort + 10) {
      console.log(`Port ${currentPort - 1} is busy, trying ${currentPort}...`);
      listen(currentPort);
      return;
    }
  }

  console.error(err);
  process.exit(1);
});

if (require.main === module) {
  listen(requestedPort);
}

module.exports = { server, listen };
