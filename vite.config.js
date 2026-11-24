import { defineConfig } from 'vite';

// Relative base so the built site works from any static host or sub-path.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 900 }
});
