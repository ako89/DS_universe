import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// `base` must match the GitHub Pages subpath (https://<user>.github.io/DS_universe/).
// If the repo is ever renamed or moved to a custom domain, change it here.
export default defineConfig({
  base: '/DS_universe/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
