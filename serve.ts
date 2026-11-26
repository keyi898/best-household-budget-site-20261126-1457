// Local preview server for app/ (Node 22, standard library only).
// Usage: node serve.ts [--port 8080]  — serves app/ at the server root so
// root-relative paths like /style.css resolve to app/style.css.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const flagAt = argv.indexOf('--port');
const parsed = flagAt === -1 ? 8080 : Number(argv[flagAt + 1]);
const listenPort = Number.isInteger(parsed) && parsed > 1023 && parsed < 65536 ? parsed : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer((req, res) => {
  const parsedUrl = new URL(req.url ?? '/', 'http://localhost');
  let pathname: string;
  try {
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = resolve(join(appRoot, normalize(pathname)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let byteSize: number;
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error('not a file');
    byteSize = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'content-length': byteSize,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
}).listen(listenPort, '127.0.0.1', () => {
  console.log('serving app/ at http://localhost:' + listenPort);
});
