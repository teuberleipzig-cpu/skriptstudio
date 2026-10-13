import { defineConfig } from 'vite';
import { basePath } from './scripts/base-path.mjs';
export default defineConfig({
  base: basePath(),
  // Vite reads jsx: react-jsx from tsconfig. No wrapper or runtime CDN needed.
  build: { target: 'es2022', assetsInlineLimit: 0, sourcemap: false },
  worker: { format: 'es' },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
