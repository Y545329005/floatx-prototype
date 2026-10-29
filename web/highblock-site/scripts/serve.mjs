import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for ${flag}`);
  return args[i + 1];
};
for (let i = 0; i < args.length; i += 2) {
  if (!['--port', '--base'].includes(args[i])) throw new Error(`Unknown option: ${args[i]}`);
}
const port = Number(value('--port', '8791'));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
const baseInput = value('--base', '/');
if (!/^\/[a-zA-Z0-9_/-]*$/.test(baseInput) || baseInput.includes('//')) throw new Error('Invalid base path');
const base = baseInput.endsWith('/') ? baseInput : `${baseInput}/`;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4',
};
const server = http.createServer(async (req, res) => {
  const reply = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return reply(405, 'Method not allowed'); }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return reply(400, 'Bad request'); }
  if (base !== '/' && pathname === base.slice(0, -1)) {
    res.writeHead(308, { Location: base }); return res.end();
  }
  if (!pathname.startsWith(base)) return reply(404, 'Not found');
  const relative = pathname.slice(base.length);
  const requested = path.resolve(root, relative || 'index.html');
  if (requested !== path.resolve(root) && !requested.startsWith(root)) return reply(403, 'Forbidden');
  const candidates = [requested];
  if (pathname.endsWith('/')) candidates.unshift(path.join(requested, 'index.html'));
  else if (!path.extname(requested)) candidates.push(`${requested}.html`, path.join(requested, 'index.html'));
  for (const candidate of candidates) {
    try {
      const actual = await fs.realpath(candidate);
      if (!actual.startsWith(root) || !(await fs.stat(actual)).isFile()) continue;
      const body = await fs.readFile(actual);
      res.writeHead(200, {
        'Content-Type': mime[path.extname(actual)] || 'application/octet-stream',
        'Content-Length': body.length, 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) console.error(error.message); }
  }
  reply(404, 'Not found');
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  console.log(`HighBlock dev preview: http://127.0.0.1:${port}${base}`);
  console.log('Build source changes with npm run build, then refresh. Ctrl+C stops the preview.');
});
