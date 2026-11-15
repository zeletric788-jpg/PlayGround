import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';

const portFlag = process.argv.findIndex((arg) => arg === '--port');
const portValue = portFlag >= 0 ? process.argv[portFlag + 1] : process.argv.find((arg) => arg.startsWith('--port='))?.slice(7);
const port = Number(portValue || process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port: ${portValue}`);
const root = resolve(process.cwd(), 'dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^[/\\]+/, '');
  const file = resolve(root, relative);
  if ((file !== root && !file.startsWith(`${root}${sep}`)) || !existsSync(file)) { response.writeHead(404).end('Not found'); return; }
  response.writeHead(200, { 'content-type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
  createReadStream(file).pipe(response);
}).listen(port, '0.0.0.0', () => console.log(`FRONTIER listening on ${port}`));
