const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);

function readArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) return fallback;
  return args[index + 1];
}

const rootDir = path.resolve(readArg('--root', __dirname));
const preferredPort = Number(readArg('--port', '8124'));
let activePort = preferredPort;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function resolveFilePath(urlPath) {
  const cleanPath = decodeURIComponent((urlPath || '/').split('?')[0]);
  const requestedPath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^[/\\]+/, '');
  const absolutePath = path.resolve(rootDir, requestedPath);

  if (absolutePath !== rootDir && !absolutePath.startsWith(rootDir + path.sep)) {
    return null;
  }

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    return absolutePath;
  }

  return null;
}

const server = http.createServer((request, response) => {
  const filePath = resolveFilePath(request.url);

  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('File not found.');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Unable to read file.');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    response.end(content);
  });
});

function startServer(port) {
  activePort = port;

  server.listen(activePort, '127.0.0.1', () => {
    console.log(`PrepIQ frontend server running at http://127.0.0.1:${activePort}/index.html`);
  });
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && activePort < preferredPort + 20) {
    const nextPort = activePort + 1;
    console.log(`Port ${activePort} is busy. Trying ${nextPort}...`);
    startServer(nextPort);
    return;
  }

  console.error(error.message);
  process.exit(1);
});

startServer(preferredPort);
