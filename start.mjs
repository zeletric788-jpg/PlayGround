import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 3000);
const root = process.cwd();
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^[/\\]+/, '');
  const file = join(root, relative);
  if (!file.startsWith(root) || !existsSync(file)) { response.writeHead(404).end('Not found'); return; }
  response.writeHead(200, { 'content-type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
  createReadStream(file).pipe(response);
}).listen(port, '0.0.0.0', () => console.log(`FRONTIER listening on ${port}`));
