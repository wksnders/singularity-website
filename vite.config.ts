/* vue-tsc type-checks this file, so the two Node symbols it needs (`process` and `node:url`) are typed locally, via the module-scoped declare and the @ts-expect-error below, rather than by adding @types/node. */

// @ts-expect-error — untyped without @types/node; see the note above.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

declare const process: { env: Record<string, string | undefined> };

/* GitHub Pages serves this project page from /<repo>/, so BASE_PATH is the only place the repo name may appear: the router reads it via import.meta.env.BASE_URL, and a custom domain or user page means BASE_PATH=/. */
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
    // Never inline images: assets stay hashed files so they cache independently of the JS bundle.
    assetsInlineLimit: 0,
  },
});
