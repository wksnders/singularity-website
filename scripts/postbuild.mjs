/* ============================================================================
   GitHub Pages has no server-side rewrite, so a deep link like
   /universe/cards asks for a file that does not exist and Pages answers with
   404.html — without changing the URL in the address bar.

   Shipping the SPA shell as 404.html therefore makes every route work on a
   cold load, and vue-router reads the intact URL and renders the right page.
   Without this, only "/" survives a refresh, and every anchor and filter param
   in PORT-NOTES rule 5 stops being a shareable contract.

   Node builtins only — this is a build step, not a dependency.
   ========================================================================== */

import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const shell = resolve(dist, 'index.html');

if (!existsSync(shell)) {
  console.error('[postbuild] dist/index.html is missing — did vite build run?');
  process.exit(1);
}

copyFileSync(shell, resolve(dist, '404.html'));
console.log('[postbuild] dist/404.html written (SPA fallback for GitHub Pages)');
