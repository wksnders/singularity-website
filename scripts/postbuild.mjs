/* dist/404.html must stay a copy of index.html: GitHub Pages has no server-side rewrite, so deep links are served 404.html with the URL intact and vue-router resolves the route. */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const shell = resolve(dist, 'index.html');

if (!existsSync(shell)) {
  console.error('[postbuild] dist/index.html is missing — did vite build run?');
  process.exit(1);
}

// remove comments from shipped html as an extra step because vite doesn't do that for us.
const html = readFileSync(shell, 'utf8');
writeFileSync(shell, html.replace(/<!--[\s\S]*?-->/g, ''));
console.log('[postbuild] dist/index.html: HTML comments stripped');

copyFileSync(shell, resolve(dist, '404.html'));
console.log('[postbuild] dist/404.html written (SPA fallback for GitHub Pages)');
