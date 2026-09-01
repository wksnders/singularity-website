/* This file is the ONE place the project touches Node APIs, and `vue-tsc
   --noEmit` checks it along with src/. Without Node's types that is two errors
   (`node:url` and `process`) and the build — and therefore the Pages deploy —
   fails. Rather than add @types/node for two symbols, since the small
   dependency footprint here is deliberate, both are handled locally:

   - `process` gets a module-scoped `declare` below. Module-scoped, so it does
     NOT leak into application code the way a global .d.ts would.
   - `fileURLToPath` keeps the real Node implementation (hand-rolling it means
     getting Windows drive letters right, and this repo is written on Windows
     and built on Linux). Its resolution error is suppressed, so it types as
     `any` — acceptable for one call used twice in a build file.

   To switch to real types instead: `npm i -D @types/node`, add "node" to
   `types` in tsconfig.json, then delete both lines below. The
   @ts-expect-error will start failing the moment the types exist, which is the
   reminder to finish the job. */

// @ts-expect-error — untyped without @types/node; see the note above.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

declare const process: { env: Record<string, string | undefined> };

/* A GitHub Pages *project* page serves from /<repo>/, so every asset URL and
   the router's history base hang off this one value. The router already reads
   it via import.meta.env.BASE_URL — do not hard-code the repo name anywhere
   else. Moving to a custom domain (or a user page) is `BASE_PATH=/`. */
const BASE_PATH = process.env.BASE_PATH ?? '/singularity-website/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Art is the crown jewel: keep hashed asset names but never inline images,
    // so the browser can cache them independently of the JS bundle.
    assetsInlineLimit: 0,
  },
});
