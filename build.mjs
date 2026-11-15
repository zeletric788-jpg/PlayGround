import { copyFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const project = process.cwd();
const output = resolve(project, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'game.js']) {
  await copyFile(resolve(project, file), resolve(output, file));
}
console.log(`Built static site at ${output}`);
